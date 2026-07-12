import {
  db,
  Collections,
  getCollection,
  getDocRef,
  firestoreQuery,
  firestoreGet,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
} from "../lib/firebase/firestore";
import { doc, collection } from "firebase/firestore";
import {
  calculateDynamicOdds,
  calculatePotentialPayout,
} from "../utils/oddsCalculator";
import type { Prediction, PlacePredictionPayload } from "../types/prediction.types";
import type { Match } from "../types/match.types";
import type { UserProfile } from "../types/auth.types";
import type { Unsubscribe } from "firebase/firestore";
import { APP_CONFIG } from "../constants/config";
import { MOCK_MATCHES } from "../constants/mockData";

export const USE_MOCK = !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === "demo-project";

const OUTCOME_LABEL_VI: Record<string, string> = {
  HOME_WIN: "chủ nhà thắng",
  DRAW: "hòa",
  AWAY_WIN: "khách thắng",
};

// In-memory mock predictions store
const mockPredictions: Prediction[] = [];

export const predictionService = {
  placePrediction: async (
    uid: string,
    payload: PlacePredictionPayload
  ): Promise<Prediction> => {
    const { matchId, outcome, amount } = payload;

    if (amount < APP_CONFIG.MIN_BET) {
      throw new Error(`Số coin cược tối thiểu là ${APP_CONFIG.MIN_BET}.`);
    }
    if (amount > APP_CONFIG.MAX_BET) {
      throw new Error(`Số coin cược tối đa là ${APP_CONFIG.MAX_BET}.`);
    }

    if (USE_MOCK) {
      const mockMatch = MOCK_MATCHES.find((m) => m.id === matchId);
      if (!mockMatch) throw new Error("Không tìm thấy trận đấu.");
      if (!mockMatch.isPredictionOpen) throw new Error("Dự đoán cho trận này đã đóng.");

      const oddsByOutcome: Record<string, number> = {
        HOME_WIN: mockMatch.odds.homeWin,
        DRAW: mockMatch.odds.draw,
        AWAY_WIN: mockMatch.odds.awayWin,
      };
      const oddsAtTime = oddsByOutcome[outcome] ?? 2.0;

      const prediction: Prediction = {
        id: `mock-pred-${Date.now()}`,
        userId: uid,
        matchId,
        matchSnapshot: {
          homeTeam: { name: mockMatch.homeTeam.name, crest: mockMatch.homeTeam.crest },
          awayTeam: { name: mockMatch.awayTeam.name, crest: mockMatch.awayTeam.crest },
          utcDate: Timestamp.now(),
          leagueName: mockMatch.leagueName,
        },
        outcome,
        amount,
        oddsAtTime,
        potentialPayout: calculatePotentialPayout(amount, oddsAtTime),
        actualPayout: null,
        status: "PENDING",
        settledAt: null,
        createdAt: Timestamp.now(),
      };
      mockPredictions.push(prediction);
      return prediction;
    }

    const predictionId = doc(collection(db, Collections.PREDICTIONS)).id;

    return runTransaction(db, async (txn) => {
      const userRef = getDocRef<UserProfile>(Collections.USERS, uid);
      const userSnap = await txn.get(userRef);
      if (!userSnap.exists()) throw new Error("Không tìm thấy người dùng.");
      const userData = userSnap.data() as UserProfile;
      if (userData.coinBalance < amount) throw new Error("Số dư coin không đủ.");

      const matchRef = getDocRef<Match>(Collections.MATCHES, matchId);
      const matchSnap = await txn.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Không tìm thấy trận đấu.");
      const matchData = matchSnap.data() as Match;
      if (!matchData.isPredictionOpen) throw new Error("Trận đấu đã đóng dự đoán.");
      if (matchData.isSettled) throw new Error("Trận đấu đã được xử lý kết quả.");
      // Defense-in-depth: don't rely solely on `isPredictionOpen`, which is
      // only as fresh as the last sync job run (e.g. every 10 minutes, or
      // stale entirely if the sync job hasn't run). Also check the actual
      // kickoff time directly, so a match can never be bet on once it has
      // genuinely started — even if `isPredictionOpen` hasn't caught up yet.
      if (matchData.utcDate.toMillis() <= Date.now()) {
        throw new Error("Trận đấu đã bắt đầu, không thể đặt dự đoán.");
      }

      const updatedStats = {
        ...matchData.predictionStats,
        totalBets: matchData.predictionStats.totalBets + 1,
        homeWinBets: outcome === "HOME_WIN" ? matchData.predictionStats.homeWinBets + 1 : matchData.predictionStats.homeWinBets,
        drawBets: outcome === "DRAW" ? matchData.predictionStats.drawBets + 1 : matchData.predictionStats.drawBets,
        awayWinBets: outcome === "AWAY_WIN" ? matchData.predictionStats.awayWinBets + 1 : matchData.predictionStats.awayWinBets,
        totalCoinsWagered: matchData.predictionStats.totalCoinsWagered + amount,
      };

      const newOdds = calculateDynamicOdds(updatedStats, matchData.odds);
      const oddsAtTime = { HOME_WIN: newOdds.homeWin, DRAW: newOdds.draw, AWAY_WIN: newOdds.awayWin }[outcome];
      const potentialPayout = calculatePotentialPayout(amount, oddsAtTime);
      const now = serverTimestamp();

      const prediction: Omit<Prediction, "id"> = {
        userId: uid,
        matchId,
        matchSnapshot: {
          homeTeam: { name: matchData.homeTeam.name, crest: matchData.homeTeam.crest },
          awayTeam: { name: matchData.awayTeam.name, crest: matchData.awayTeam.crest },
          utcDate: matchData.utcDate,
          leagueName: matchData.leagueName,
        },
        outcome,
        amount,
        oddsAtTime,
        potentialPayout,
        actualPayout: null,
        status: "PENDING",
        settledAt: null,
        createdAt: now as Timestamp,
      };

      const predRef = getDocRef(Collections.PREDICTIONS, predictionId);
      txn.set(predRef, prediction);

      const userPredRef = getDocRef(`${Collections.USERS}/${uid}/predictions`, predictionId);
      txn.set(userPredRef, prediction);

      txn.update(userRef, {
        coinBalance: increment(-amount),
        totalPredictions: increment(1),
        updatedAt: now,
      });

      const txRef = getDocRef(`${Collections.USERS}/${uid}/transactions`, predictionId);
      txn.set(txRef, {
        type: "BET_PLACED",
        amount: -amount,
        balanceAfter: userData.coinBalance - amount,
        reference: predictionId,
        description: `Đã dự đoán ${OUTCOME_LABEL_VI[outcome]} — ${matchData.homeTeam.name} - ${matchData.awayTeam.name}`,
        createdAt: now,
      });

      txn.update(matchRef, {
        predictionStats: updatedStats,
        "odds.homeWin": newOdds.homeWin,
        "odds.draw": newOdds.draw,
        "odds.awayWin": newOdds.awayWin,
        "odds.lastUpdated": now,
      });

      return { id: predictionId, ...prediction } as Prediction;
    });
  },

  getMyPredictions: async (
    uid: string,
    statusFilter?: Prediction["status"]
  ): Promise<Prediction[]> => {
    if (USE_MOCK) {
      return mockPredictions.filter(
        (p) => p.userId === uid && (!statusFilter || p.status === statusFilter)
      );
    }
    const constraints = [
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(50),
    ];
    if (statusFilter) constraints.unshift(where("status", "==", statusFilter));
    return firestoreQuery<Prediction>(
      query(getCollection<Prediction>(Collections.PREDICTIONS), ...constraints)
    );
  },

  getMatchPredictionSummary: async (
    matchId: string
  ): Promise<{ homeWin: number; draw: number; awayWin: number } | null> => {
    if (USE_MOCK) return { homeWin: 45, draw: 30, awayWin: 25 };
    const match = await firestoreGet(getDocRef<Match>(Collections.MATCHES, matchId));
    if (!match) return null;
    const total = match.predictionStats.homeWinBets + match.predictionStats.drawBets + match.predictionStats.awayWinBets;
    if (total === 0) return { homeWin: 33, draw: 34, awayWin: 33 };
    return {
      homeWin: Math.round((match.predictionStats.homeWinBets / total) * 100),
      draw: Math.round((match.predictionStats.drawBets / total) * 100),
      awayWin: Math.round((match.predictionStats.awayWinBets / total) * 100),
    };
  },

  subscribeToMyPredictions: (
    uid: string,
    callback: (predictions: Prediction[]) => void
  ): Unsubscribe => {
    if (USE_MOCK) {
      callback(mockPredictions.filter((p) => p.userId === uid));
      return () => {};
    }
    const q = query(
      getCollection<Prediction>(`${Collections.USERS}/${uid}/predictions`),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ ...(d.data() as Prediction), id: d.id })));
    });
  },
};

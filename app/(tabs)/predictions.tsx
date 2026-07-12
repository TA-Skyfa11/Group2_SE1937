import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyPredictions } from "../../hooks/usePredictions";
import { useCoins } from "../../hooks/useCoins";
import { useLeaderboard, useMyLeaderboardRank } from "../../hooks/useLeaderboard";
import { leaderboardService } from "../../services/leaderboardService";
import { getRankEmoji, formatScore } from "../../utils/leaderboardCalc";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { RoleGuard } from "../../components/common/RoleGuard";
import type { Prediction, PredictionStatus } from "../../types/prediction.types";
import type { LeaderboardPeriod } from "../../types/leaderboard.types";
import type { PredictionOutcome } from "../../types/match.types";

type MainTab = "active" | "history" | "leaderboard";
type PeriodKey = "allTime" | "monthly" | "weekly";

const OUTCOME_LABELS: Record<PredictionOutcome, string> = {
  HOME_WIN: "Chủ nhà thắng",
  DRAW: "Hòa",
  AWAY_WIN: "Khách thắng",
};

const STATUS_STYLE: Record<PredictionStatus, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: "rgba(234,179,8,0.1)",  text: "#eab308", label: "Chờ kết quả" },
  WON:      { bg: "rgba(20,184,166,0.1)", text: "#14b8a6", label: "Thắng ✓" },
  LOST:     { bg: "rgba(239,68,68,0.1)",  text: "#ef4444", label: "Thua" },
  VOID:     { bg: "rgba(115,115,115,0.1)", text: "#64748b", label: "Hủy" },
};

function PredictionCard({ p }: { p: Prediction }) {
  const s = STATUS_STYLE[p.status];
  return (
    <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 16, padding: 16, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: "#64748b", fontSize: 11 }}>{p.matchSnapshot.leagueName}</Text>
        <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ color: s.text, fontSize: 11, fontWeight: "600" }}>{s.label}</Text>
        </View>
      </View>
      <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 14, marginBottom: 12 }}>
        {p.matchSnapshot.homeTeam.name} - {p.matchSnapshot.awayTeam.name}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#64748b", fontSize: 11 }}>Dự đoán</Text>
          <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "500", marginTop: 2 }}>
            {OUTCOME_LABELS[p.outcome]}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#64748b", fontSize: 11 }}>Tỷ lệ</Text>
          <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "500", marginTop: 2 }}>
            {p.oddsAtTime.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#64748b", fontSize: 11 }}>
            {p.status === "PENDING" ? "Có thể nhận" : p.status === "WON" ? "Đã thắng" : "Đã cược"}
          </Text>
          <Text style={{ color: p.status === "WON" ? "#14b8a6" : p.status === "LOST" ? "#ef4444" : "#0f172a", fontSize: 14, fontWeight: "700", marginTop: 2 }}>
            {p.status === "WON"
              ? `+${(p.actualPayout ?? 0).toLocaleString()}`
              : p.status === "PENDING"
              ? p.potentialPayout.toLocaleString()
              : `-${p.amount.toLocaleString()}`}{" "}🪙
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PredictionsScreen() {
  // Predictions require a logged-in user (coin usage, personal bet
  // history). RoleGuard redirects Guests to /login instead of letting
  // this screen mount and fire authenticated-only Firestore queries.
  return (
    <RoleGuard requiredRole="user">
      <PredictionsScreenContent />
    </RoleGuard>
  );
}

function PredictionsScreenContent() {
  const [tab, setTab] = useState<MainTab>("active");
  const [periodKey, setPeriodKey] = useState<PeriodKey>("allTime");
  const { balance } = useCoins();
  const periods = leaderboardService.getPeriodKeys();

  const periodMap: Record<PeriodKey, LeaderboardPeriod> = {
    allTime: periods.allTime,
    monthly: periods.monthly,
    weekly: periods.weekly,
  };
  const period = periodMap[periodKey];

  const { data: pending, isLoading: pendLoad } = useMyPredictions("PENDING");
  const { data: allPreds, isLoading: allLoad } = useMyPredictions();
  const { data: board, isLoading: boardLoad } = useLeaderboard(period);
  const { data: myRank } = useMyLeaderboardRank(period);

  const settled = (allPreds ?? []).filter((p) => p.status !== "PENDING");

  const TABS: { key: MainTab; label: string }[] = [
    { key: "active", label: "Đang chờ" },
    { key: "history", label: "Lịch sử" },
    { key: "leaderboard", label: "Xếp hạng" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: "#0f172a", fontSize: 24, fontWeight: "700" }}>Dự đoán</Text>
          <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>🪙 {balance.toLocaleString()} coin</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
              backgroundColor: tab === key ? "#14b8a6" : "#ffffff",
              borderWidth: 1, borderColor: tab === key ? "#14b8a6" : "#e7e9ee",
            }}
          >
            <Text style={{ color: tab === key ? "#fff" : "#64748b", fontSize: 13, fontWeight: "600" }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {/* Active */}
        {tab === "active" && (
          pendLoad ? <LoadingSpinner /> :
          (pending?.length ?? 0) === 0
            ? <EmptyState icon="🎯" title="Chưa có dự đoán nào" subtitle="Vào một trận đấu và đặt dự đoán của bạn!" />
            : (pending ?? []).map((p) => <PredictionCard key={p.id} p={p} />)
        )}

        {/* History */}
        {tab === "history" && (
          allLoad ? <LoadingSpinner /> :
          settled.length === 0
            ? <EmptyState icon="📋" title="Chưa có lịch sử dự đoán" subtitle="Các dự đoán đã kết thúc sẽ hiện ở đây" />
            : settled.map((p) => <PredictionCard key={p.id} p={p} />)
        )}

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <View>
            {/* Period tabs */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {([ ["allTime", "Toàn thời gian"], ["monthly", "Tháng này"], ["weekly", "Tuần này"] ] as const).map(([k, label]) => (
                <TouchableOpacity
                  key={k}
                  onPress={() => setPeriodKey(k)}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
                    backgroundColor: periodKey === k ? "rgba(20,184,166,0.15)" : "#ffffff",
                    borderWidth: 1, borderColor: periodKey === k ? "#14b8a6" : "#e7e9ee",
                  }}
                >
                  <Text style={{ color: periodKey === k ? "#14b8a6" : "#64748b", fontSize: 12, fontWeight: "600" }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* My rank */}
            {myRank && (
              <View style={{ backgroundColor: "rgba(20,184,166,0.1)", borderWidth: 1, borderColor: "rgba(20,184,166,0.3)", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>Hạng của bạn</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#0f172a", fontSize: 24, fontWeight: "700" }}>{getRankEmoji(myRank.rank)}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#14b8a6", fontSize: 16, fontWeight: "700" }}>{formatScore(myRank.score)} điểm</Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{Math.round(myRank.winRate * 100)}% thắng</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Board */}
            {boardLoad ? <LoadingSpinner /> : (
              <View style={{ gap: 8 }}>
                {(board?.topEntries ?? []).map((entry) => (
                  <View
                    key={entry.userId}
                    style={{
                      backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
                      borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
                    }}
                  >
                    <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 16, width: 36, textAlign: "center" }}>
                      {getRankEmoji(entry.rank)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 14 }} numberOfLines={1}>
                        {entry.displayName}
                      </Text>
                      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                        {entry.totalPredictions} dự đoán · {Math.round(entry.winRate * 100)}% thắng
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: "#14b8a6", fontSize: 14, fontWeight: "700" }}>
                        {formatScore(entry.score)}
                      </Text>
                      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                        🔥 {entry.currentStreak}
                      </Text>
                    </View>
                  </View>
                ))}
                {(board?.topEntries.length ?? 0) === 0 && (
                  <EmptyState icon="🏆" title="Bảng xếp hạng còn trống" subtitle="Hãy là người đầu tiên dự đoán!" />
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { TouchableOpacity, View, Text } from "react-native";
import { router } from "expo-router";
import type { Match } from "../../types/match.types";
import { formatMatchDate } from "../../utils/dateUtils";
import { TeamCrest } from "../common/TeamCrest";

interface Props {
  match: Match;
  showOdds?: boolean;
}

export function MatchCard({ match, showOdds = false }: Props) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const showScore = isLive || isFinished;

  return (
    <TouchableOpacity
      className="bg-white border border-slate-200 rounded-2xl p-4 mb-3"
      style={{
        shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }}
      onPress={() => router.push(`/match/${match.id}` as any)}
      activeOpacity={0.8}
    >
      {/* League + status row */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-slate-500 text-xs" numberOfLines={1}>
          {match.leagueName}
          {match.stage ? ` · ${match.stage}` : ""}
        </Text>
        {isLive ? (
          <View className="flex-row items-center gap-x-1">
            <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <Text className="text-red-600 text-xs font-semibold">{match.minute}'</Text>
          </View>
        ) : isFinished ? (
          <Text className="text-slate-500 text-xs">Kết thúc</Text>
        ) : (
          <Text className="text-slate-500 text-xs">{formatMatchDate(match.utcDate)}</Text>
        )}
      </View>

      {/* Teams + score */}
      <View className="flex-row items-center">
        <View className="flex-1 flex-row items-center gap-x-2">
          <TeamCrest team={match.homeTeam} />
          <Text className="text-slate-900 font-semibold text-sm flex-1" numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>

        {showScore ? (
          <View className="px-4 items-center">
            <Text className="text-slate-900 font-bold text-xl tracking-widest">
              {match.score.fullTime.home ?? 0} – {match.score.fullTime.away ?? 0}
            </Text>
            {match.score.halfTime.home !== null && (
              <Text className="text-slate-500 text-xs mt-0.5">
                HT {match.score.halfTime.home}–{match.score.halfTime.away}
              </Text>
            )}
          </View>
        ) : (
          <View className="px-4 items-center">
            <Text className="text-slate-500 text-xs">Gặp</Text>
          </View>
        )}

        <View className="flex-1 flex-row items-center justify-end gap-x-2">
          <Text className="text-slate-900 font-semibold text-sm flex-1 text-right" numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
          <TeamCrest team={match.awayTeam} />
        </View>
      </View>

      {/* Odds row */}
      {showOdds && match.isPredictionOpen && !match.isSettled && (
        <View className="flex-row gap-x-2 mt-3">
          {[
            { label: "1", value: match.odds.homeWin },
            { label: "X", value: match.odds.draw },
            { label: "2", value: match.odds.awayWin },
          ].map(({ label, value }) => (
            <View
              key={label}
              className="flex-1 bg-slate-100 rounded-lg py-2 items-center"
            >
              <Text className="text-slate-500 text-xs mb-0.5">{label}</Text>
              <Text className="text-teal-600 font-semibold text-sm">
                {value.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

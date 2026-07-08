import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useLiveMatch, useMatchEvents } from "../../hooks/useMatches";
import { useMatchPredictionSummary, usePredictionSheet } from "../../hooks/usePredictions";
import { useFavorites } from "../../hooks/useFavorites";
import { PredictionSheet } from "../../components/prediction/PredictionSheet";
import { OddsButton } from "../../components/prediction/OddsButton";
import { MatchSkeleton } from "../../components/skeleton/MatchSkeleton";
import { formatDateFull } from "../../utils/dateUtils";
import type { Match, MatchEvent } from "../../types/match.types";

type Tab = "overview" | "stats" | "events" | "lineups" | "predict";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Chưa diễn ra", LIVE: "Trực tiếp", PAUSED: "Nghỉ giữa trận",
  FINISHED: "Kết thúc", POSTPONED: "Tạm hoãn", CANCELLED: "Đã hủy",
};
const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "#737373", LIVE: "#ef4444", PAUSED: "#eab308",
  FINISHED: "#737373", POSTPONED: "#f97316", CANCELLED: "#ef4444",
};

/* ── Score Header ─────────────────────────────────────────── */
function ScoreHeader({ match }: { match: Match }) {
  const isScheduled = match.status === "SCHEDULED";
  return (
    <View style={{ padding: 20, alignItems: "center" }}>
      <Text style={{ color: "#737373", fontSize: 12, marginBottom: 16 }}>
        {match.leagueName}{match.stage ? ` · ${match.stage}` : ""}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
        {/* Home */}
        <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#171717", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>🛡</Text>
          </View>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14, textAlign: "center" }} numberOfLines={2}>
            {match.homeTeam.name}
          </Text>
        </View>
        {/* Centre */}
        <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
          {isScheduled ? (
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 28 }}>vs</Text>
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                {formatDateFull(match.utcDate)}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 48, letterSpacing: 2 }}>
                {match.score.fullTime.home ?? 0}–{match.score.fullTime.away ?? 0}
              </Text>
              {match.score.halfTime.home !== null && (
                <Text style={{ color: "#525252", fontSize: 12, marginTop: 2 }}>
                  HT {match.score.halfTime.home}–{match.score.halfTime.away}
                </Text>
              )}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
            {match.status === "LIVE" && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
            )}
            <Text style={{ color: STATUS_COLOR[match.status], fontSize: 12, fontWeight: "600" }}>
              {match.status === "LIVE" ? `${match.minute}'` : STATUS_LABEL[match.status]}
            </Text>
          </View>
        </View>
        {/* Away */}
        <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#171717", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>🛡</Text>
          </View>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14, textAlign: "center" }} numberOfLines={2}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Overview Tab ─────────────────────────────────────────── */
function OverviewTab({
  match,
  predSummary,
}: {
  match: Match;
  predSummary: { homeWin: number; draw: number; awayWin: number } | null | undefined;
}) {
  return (
    <View style={{ gap: 12 }}>
      {/* Match info */}
      <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 16, padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 14 }}>Thông tin trận đấu</Text>
        {[
          { label: "Giải đấu", value: match.leagueName },
          { label: "Ngày", value: formatDateFull(match.utcDate) },
          match.venue ? { label: "Địa điểm", value: match.venue } : null,
          match.referee ? { label: "Trọng tài", value: match.referee } : null,
        ]
          .filter(Boolean)
          .map((item) => (
            <View key={item!.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ color: "#737373", fontSize: 13 }}>{item!.label}</Text>
              <Text style={{ color: "#fff", fontSize: 13, flex: 1, textAlign: "right", marginLeft: 16 }} numberOfLines={1}>
                {item!.value}
              </Text>
            </View>
          ))}
      </View>

      {/* Prediction distribution */}
      {predSummary && (
        <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 16, padding: 16 }}>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 14 }}>Phân bổ dự đoán</Text>
          <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12, gap: 2 }}>
            <View style={{ flex: predSummary.homeWin, backgroundColor: "#14b8a6" }} />
            <View style={{ flex: predSummary.draw, backgroundColor: "#525252" }} />
            <View style={{ flex: predSummary.awayWin, backgroundColor: "#f97316" }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#14b8a6", fontWeight: "700", fontSize: 16 }}>{predSummary.homeWin}%</Text>
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>{match.homeTeam.shortName}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#a3a3a3", fontWeight: "700", fontSize: 16 }}>{predSummary.draw}%</Text>
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>Hòa</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#f97316", fontWeight: "700", fontSize: 16 }}>{predSummary.awayWin}%</Text>
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>{match.awayTeam.shortName}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Odds */}
      <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 16, padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 12 }}>Tỷ lệ hiện tại</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: `1 · ${match.homeTeam.tla}`, value: match.odds.homeWin },
            { label: "X · Hòa", value: match.odds.draw },
            { label: `2 · ${match.awayTeam.tla}`, value: match.odds.awayWin },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, backgroundColor: "#262626", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ color: "#737373", fontSize: 11, marginBottom: 4 }}>{label}</Text>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ── Stats Tab ────────────────────────────────────────────── */
function StatsTab({ match }: { match: Match }) {
  const STATS = [
    { label: "Kiểm soát bóng", home: 54, away: 46, pct: true },
    { label: "Dứt điểm", home: 12, away: 8, pct: false },
    { label: "Dứt điểm trúng đích", home: 5, away: 3, pct: false },
    { label: "Phạt góc", home: 6, away: 4, pct: false },
    { label: "Phạm lỗi", home: 10, away: 13, pct: false },
    { label: "Thẻ vàng", home: 2, away: 3, pct: false },
    { label: "Chính xác chuyền bóng", home: 84, away: 77, pct: true },
  ];

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }} numberOfLines={1}>
          {match.homeTeam.shortName}
        </Text>
        <Text style={{ color: "#737373", fontSize: 13 }}>Chỉ số</Text>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }} numberOfLines={1}>
          {match.awayTeam.shortName}
        </Text>
      </View>
      {STATS.map(({ label, home, away, pct }) => {
        const total = home + away || 1;
        return (
          <View key={label}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{home}{pct ? "%" : ""}</Text>
              <Text style={{ color: "#737373", fontSize: 12 }}>{label}</Text>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{away}{pct ? "%" : ""}</Text>
            </View>
            <View style={{ flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden" }}>
              <View style={{ flex: home / total, backgroundColor: "#14b8a6" }} />
              <View style={{ flex: away / total, backgroundColor: "#f97316" }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ── Events Tab ───────────────────────────────────────────── */
const EVENT_ICON: Record<string, string> = {
  GOAL: "⚽", YELLOW_CARD: "🟨", RED_CARD: "🟥",
  SUBSTITUTION: "🔄", VAR: "📺", PENALTY: "🎯",
};

function EventsTab({ events, isLoading }: { events: MatchEvent[]; isLoading: boolean }) {
  if (isLoading) return <ActivityIndicator color="#14b8a6" style={{ marginTop: 40 }} />;
  if (events.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>⏱</Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Chưa có diễn biến</Text>
        <Text style={{ color: "#737373", fontSize: 13, marginTop: 6 }}>Diễn biến sẽ hiện khi trận đấu bắt đầu</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {events.map((ev) => (
        <View
          key={ev.id}
          style={{
            backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626",
            borderRadius: 12, padding: 14,
            flexDirection: "row", alignItems: "center", gap: 12,
          }}
        >
          <Text style={{ color: "#737373", fontSize: 12, width: 32, textAlign: "right" }}>
            {ev.minute}'
          </Text>
          <Text style={{ fontSize: 18 }}>{EVENT_ICON[ev.type] ?? "•"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
              {ev.playerName ?? ev.type.replace(/_/g, " ")}
            </Text>
            {ev.detail && (
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>{ev.detail}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── Lineups Tab ──────────────────────────────────────────── */
function LineupsTab() {
  return (
    <View style={{ alignItems: "center", paddingTop: 48 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Đội hình</Text>
      <Text style={{ color: "#737373", fontSize: 13, marginTop: 6, textAlign: "center" }}>
        Đội hình sẽ được công bố 1 giờ trước giờ bóng lăn
      </Text>
    </View>
  );
}

/* ── Predict Tab ──────────────────────────────────────────── */
function PredictTab({
  match,
  predSummary,
  predSheet,
}: {
  match: Match;
  predSummary: { homeWin: number; draw: number; awayWin: number } | null | undefined;
  predSheet: ReturnType<typeof usePredictionSheet>;
}) {
  if (!match.isPredictionOpen || match.isSettled) {
    return (
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
          {match.isSettled ? "Dự đoán đã kết thúc" : "Dự đoán chưa mở"}
        </Text>
        <Text style={{ color: "#737373", fontSize: 13, marginTop: 6, textAlign: "center" }}>
          {match.isSettled
            ? "Kết quả đã được xử lý."
            : "Dự đoán sẽ mở gần giờ bóng lăn."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17, marginBottom: 4 }}>
          Đặt dự đoán của bạn
        </Text>
        <Text style={{ color: "#737373", fontSize: 13 }}>
          Chọn một kết quả để mở phiếu dự đoán
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <OddsButton
          label={`1 · ${match.homeTeam.shortName}`}
          outcome="HOME_WIN"
          odds={match.odds.homeWin}
          isSelected={predSheet.activePrediction?.outcome === "HOME_WIN"}
          onPress={predSheet.selectOutcome}
        />
        <OddsButton
          label="X · Draw"
          outcome="DRAW"
          odds={match.odds.draw}
          isSelected={predSheet.activePrediction?.outcome === "DRAW"}
          onPress={predSheet.selectOutcome}
        />
        <OddsButton
          label={`2 · ${match.awayTeam.shortName}`}
          outcome="AWAY_WIN"
          odds={match.odds.awayWin}
          isSelected={predSheet.activePrediction?.outcome === "AWAY_WIN"}
          onPress={predSheet.selectOutcome}
        />
      </View>

      {predSummary && (
        <View style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 16, padding: 16 }}>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14, marginBottom: 12 }}>
            Community prediction
          </Text>
          <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10, gap: 2 }}>
            <View style={{ flex: predSummary.homeWin, backgroundColor: "#14b8a6" }} />
            <View style={{ flex: predSummary.draw, backgroundColor: "#525252" }} />
            <View style={{ flex: predSummary.awayWin, backgroundColor: "#f97316" }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#14b8a6", fontWeight: "600" }}>{predSummary.homeWin}% 1</Text>
            <Text style={{ color: "#a3a3a3", fontWeight: "600" }}>{predSummary.draw}% X</Text>
            <Text style={{ color: "#f97316", fontWeight: "600" }}>{predSummary.awayWin}% 2</Text>
          </View>
        </View>
      )}

      <View style={{ backgroundColor: "rgba(20,184,166,0.05)", borderWidth: 1, borderColor: "rgba(20,184,166,0.2)", borderRadius: 12, padding: 12 }}>
        <Text style={{ color: "#737373", fontSize: 12, lineHeight: 18 }}>
          🪙 Chỉ dùng coin ảo — mang tính giáo dục, không liên quan tiền thật. Tỷ lệ thay đổi linh động theo dự đoán của cộng đồng.
        </Text>
      </View>
    </View>
  );
}

/* ── Main Screen ──────────────────────────────────────────── */
export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: match, isLoading, refetch } = useLiveMatch(id ?? "");
  const { data: events, isLoading: eventsLoading } = useMatchEvents(id ?? "");
  const { data: predSummary } = useMatchPredictionSummary(id ?? "");
  const { isMatchFavorite, toggleMatch } = useFavorites();
  const predSheet = usePredictionSheet(id ?? "");

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "stats", label: "Chỉ số" },
    { key: "events", label: "Diễn biến" },
    { key: "lineups", label: "Đội hình" },
    { key: "predict", label: "Dự đoán" },
  ];

  if (isLoading) return <MatchSkeleton />;

  if (!match) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#737373", fontSize: 15 }}>Không tìm thấy trận đấu</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#737373", fontSize: 15 }}>← Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleMatch(id ?? "")}>
          <Text style={{ fontSize: 22 }}>{isMatchFavorite(id ?? "") ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14b8a6" />
        }
      >
        {/* Score header */}
        <ScoreHeader match={match} />

        {/* Tab strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ borderBottomWidth: 1, borderBottomColor: "#171717" }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{
                marginRight: 24, paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === key ? "#14b8a6" : "transparent",
              }}
            >
              <Text style={{ color: activeTab === key ? "#14b8a6" : "#737373", fontSize: 14, fontWeight: "600" }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={{ padding: 16, paddingBottom: 48 }}>
          {activeTab === "overview" && (
            <OverviewTab match={match} predSummary={predSummary} />
          )}
          {activeTab === "stats" && <StatsTab match={match} />}
          {activeTab === "events" && (
            <EventsTab events={events ?? []} isLoading={eventsLoading} />
          )}
          {activeTab === "lineups" && <LineupsTab />}
          {activeTab === "predict" && (
            <PredictTab match={match} predSummary={predSummary} predSheet={predSheet} />
          )}
        </View>
      </ScrollView>

      {/* Prediction modal */}
      {predSheet.isSheetOpen && <PredictionSheet match={match} />}
    </SafeAreaView>
  );
}

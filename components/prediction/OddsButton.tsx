import { TouchableOpacity, View, Text } from "react-native";
import { formatOdds } from "../../utils/oddsCalculator";
import type { PredictionOutcome } from "../../types/match.types";

interface Props {
  label: string;
  outcome: PredictionOutcome;
  odds: number;
  isSelected?: boolean;
  onPress: (outcome: PredictionOutcome) => void;
}

export function OddsButton({ label, outcome, odds, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity
      className={`flex-1 py-3 rounded-xl items-center border ${
        isSelected
          ? "border-teal-500 bg-teal-500/15"
          : "border-slate-200 bg-white"
      }`}
      onPress={() => onPress(outcome)}
      activeOpacity={0.7}
    >
      <Text className={`text-xs mb-1 ${isSelected ? "text-teal-600" : "text-slate-500"}`}>
        {label}
      </Text>
      <Text className={`font-bold text-base ${isSelected ? "text-teal-600" : "text-slate-900"}`}>
        {formatOdds(odds)}
      </Text>
    </TouchableOpacity>
  );
}

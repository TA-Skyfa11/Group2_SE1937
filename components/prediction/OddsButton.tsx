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
          : "border-neutral-800 bg-neutral-900"
      }`}
      onPress={() => onPress(outcome)}
      activeOpacity={0.7}
    >
      <Text className={`text-xs mb-1 ${isSelected ? "text-teal-400" : "text-neutral-400"}`}>
        {label}
      </Text>
      <Text className={`font-bold text-base ${isSelected ? "text-teal-400" : "text-white"}`}>
        {formatOdds(odds)}
      </Text>
    </TouchableOpacity>
  );
}

import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Pulse({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ backgroundColor: "#262626", borderRadius: 8, opacity }, style]}
    />
  );
}

export function MatchSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="px-4 pt-4">
        <Pulse style={{ width: 60, height: 16, marginBottom: 24 }} />
        <View className="flex-row justify-between items-center mb-8">
          <Pulse style={{ width: 80, height: 80, borderRadius: 40 }} />
          <Pulse style={{ width: 100, height: 48 }} />
          <Pulse style={{ width: 80, height: 80, borderRadius: 40 }} />
        </View>
        <View className="flex-row gap-x-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Pulse key={i} style={{ width: 60, height: 32 }} />
          ))}
        </View>
        {[1, 2, 3].map((i) => (
          <Pulse key={i} style={{ height: 72, marginBottom: 12 }} />
        ))}
      </View>
    </SafeAreaView>
  );
}

export function CardSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        backgroundColor: "#171717",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        height: 96,
        opacity,
      }}
    />
  );
}

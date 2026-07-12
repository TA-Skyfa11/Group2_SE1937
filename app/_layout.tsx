import "../global.css";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ToastContainer } from "../components/ui/Toast";
import { useAuthListener } from "../hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  // Mounts the Firebase onAuthStateChanged listener ONCE for the whole
  // app, right at startup, regardless of which screen the user lands on
  // first. This must be useAuthListener(), NOT useAuth() — useAuth() is
  // a plain state reader now and is safe to call from any number of
  // screens (Predictions, Profile, ...) without re-triggering this setup.
  useAuthListener();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f8fb" } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="match/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="team/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="league/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <ToastContainer />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

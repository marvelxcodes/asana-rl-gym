"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { AutomationProvider } from "./automation/automation-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { WebSocketProvider } from "./websocket-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AutomationProvider
            captureInterval={1000}
            captureScreenshots={false}
            debugMode={false}
            enabled={
              process.env.NODE_ENV === "development" ||
              process.env.NEXT_PUBLIC_AUTOMATION_ENABLED === "true"
            }
          >
            <WebSocketProvider>{children}</WebSocketProvider>
          </AutomationProvider>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </trpc.Provider>
      <Toaster richColors />
    </ThemeProvider>
  );
}

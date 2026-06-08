import { Theme, ThemePanel } from "@radix-ui/themes/dist/cjs/index.js";
import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoot from "./AppRoot.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";
import { initializeSyncfusion } from "./utils/syncfusionLicense";

initializeSyncfusion();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="95%">
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AppRoot />
        </LanguageProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </Theme>
  </StrictMode>,
);

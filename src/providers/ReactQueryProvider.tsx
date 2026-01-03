"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Refetch data every 15 minutes if used(to keep data fresh)
            staleTime: 15 * 60 * 1000,
            // Keep data in cache for 15 minutes even if not used
            gcTime: 15 * 60 * 1000,
            // Do not retry if the server returns an error
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

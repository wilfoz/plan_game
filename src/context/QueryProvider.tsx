import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";

const qc = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => toast.error(error?.message ?? "Erro ao carregar dados"),
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => toast.error(error?.message ?? "Erro ao salvar"),
  }),
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

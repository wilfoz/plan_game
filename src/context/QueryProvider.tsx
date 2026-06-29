import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import i18n from "../i18n/config";

const qc = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => toast.error(error?.message ?? "Erro ao carregar dados"),
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // Nome de grupo duplicado na mesma sessão (índice único uq_grupos_session_nome)
      const msg = String(error?.message ?? "");
      if (error?.code === "23505" && msg.includes("grupos_session_nome")) {
        toast.error(i18n.t("groups.duplicateName"));
        return;
      }
      toast.error(error?.message ?? "Erro ao salvar");
    },
  }),
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

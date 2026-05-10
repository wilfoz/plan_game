import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";

const qc = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(error?.message ?? "Erro ao carregar dados"),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(error?.message ?? "Erro ao salvar"),
  }),
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function QueryProvider({ children }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRealtimeComps(sessionId: string | null) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) { setConnected(false); return; }

    const channel = supabase
      .channel(`rt_comps_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grupo_comps",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Invalida todas as queries de grupo_comps desta sessão
          qc.invalidateQueries({ queryKey: ["grupo_comps", sessionId], exact: false });
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [sessionId, qc]);

  return { connected };
}

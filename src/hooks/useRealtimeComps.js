import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Subscribes to real-time changes on grupo_comps for the active session.
 * On any INSERT/UPDATE/DELETE, invalidates the React Query cache so
 * AppContext re-derives comps and Ranking re-renders automatically.
 */
export function useRealtimeComps(sessionId) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) { setConnected(false); return; } // eslint-disable-line react-hooks/set-state-in-effect

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

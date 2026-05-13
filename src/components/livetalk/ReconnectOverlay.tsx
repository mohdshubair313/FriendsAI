"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, Loader2, RefreshCw, Wifi } from "lucide-react";
import type { NetworkState } from "@/lib/hooks/useNetworkState";

interface ReconnectOverlayProps {
  state: NetworkState;
  /** ms epoch of the last successful contact. */
  lastOnlineAt: number;
  /** Manual retry trigger (calls heartbeat probe). */
  onRetry: () => Promise<void>;
}

/**
 * Non-blocking overlay that shows when the user is disconnected.
 *
 * Three visual states:
 *   - online       → nothing rendered
 *   - reconnecting → small pill top-center with a spinner ("Reconnecting…")
 *   - offline      → larger banner with offline icon + manual Retry button
 *
 * Auto-shows a "Stuck? Try again" prompt if reconnecting >30s — gives
 * the user agency without forcing them to refresh.
 */
export default function ReconnectOverlay({
  state,
  lastOnlineAt,
  onRetry,
}: ReconnectOverlayProps) {
  // Show the "stuck" affordance only after a sustained reconnecting state.
  const [stuck, setStuck] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (state === "online") {
      setStuck(false);
      return;
    }
    const t = window.setTimeout(() => setStuck(true), 30_000);
    return () => window.clearTimeout(t);
  }, [state, lastOnlineAt]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <AnimatePresence>
      {state !== "online" && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] pointer-events-auto"
        >
          <div
            className={
              state === "offline"
                ? "flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-xl shadow-2xl"
                : "flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl shadow-2xl"
            }
          >
            {state === "offline" ? (
              <CloudOff className="size-4 text-rose-400" />
            ) : (
              <Loader2 className="size-4 text-amber-300 animate-spin" />
            )}
            <p className="text-sm font-medium text-zinc-100">
              {state === "offline"
                ? "You're offline. Trying to reconnect…"
                : "Reconnecting…"}
            </p>
            {stuck && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-100 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {retrying ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Retry
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Brief "back online" confirmation chip — fades in/out for 2s
          after recovering from a non-online state. */}
      {state === "online" && lastOnlineAt > 0 && (
        <RecoveredChip lastOnlineAt={lastOnlineAt} />
      )}
    </AnimatePresence>
  );
}

function RecoveredChip({ lastOnlineAt }: { lastOnlineAt: number }) {
  // Only show if we recently recovered (within last 3s).
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 2200);
    return () => window.clearTimeout(t);
  }, [lastOnlineAt]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -32, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[249] pointer-events-none"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl shadow-xl">
        <Wifi className="size-3.5 text-emerald-300" />
        <p className="text-xs font-medium text-emerald-100">Back online</p>
      </div>
    </motion.div>
  );
}

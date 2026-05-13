"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Three-state network monitor.
 *
 * navigator.onLine alone isn't trustworthy:
 *   - Reports "online" on captive portals (hotel WiFi)
 *   - Reports "online" on dead-router LAN connections
 *   - Doesn't notice ISP outages until you try a request
 *
 * So we layer:
 *   1. `online`/`offline` browser events  → instant signal when OS knows
 *   2. POST /api/voice/heartbeat every 15s → catches "looks online but isn't"
 *   3. Visibility change → eagerly probe when tab returns to foreground
 *
 * State transitions:
 *
 *   online  ──network drop──▶  reconnecting  ──recovers──▶  online
 *      ▲                            │
 *      └────────heartbeat OK────────┘
 *
 *   any state ──visibility "visible"──▶ probe immediately
 *
 * The hook returns `{ state, lastOnlineAt, retry }`. Components show a
 * banner when state !== "online".
 */

export type NetworkState = "online" | "offline" | "reconnecting";

interface UseNetworkStateReturn {
  state: NetworkState;
  /** ms epoch of the last successful heartbeat / online event. */
  lastOnlineAt: number;
  /** Manual probe (used by Retry button on the overlay). */
  retry: () => Promise<void>;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;

export function useNetworkState(enabled: boolean = true): UseNetworkStateReturn {
  const [state, setState] = useState<NetworkState>(() => {
    if (typeof navigator === "undefined") return "online";
    return navigator.onLine ? "online" : "offline";
  });
  const [lastOnlineAt, setLastOnlineAt] = useState<number>(Date.now());

  // Keep the most recent state in a ref so the heartbeat loop reads
  // current value without re-creating the interval on every state change.
  const stateRef = useRef<NetworkState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  /** Single heartbeat probe — resolves to true on success. */
  const probe = useRef(async (): Promise<boolean> => {
    try {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), HEARTBEAT_TIMEOUT_MS);
      const res = await fetch("/api/voice/heartbeat", {
        method: "POST",
        signal: ctrl.signal,
        // Don't surface this in dev console as a failed network log if
        // the auth cookie hasn't loaded yet — 401 is also "alive".
        credentials: "same-origin",
      });
      window.clearTimeout(t);
      return res.status !== 0; // any HTTP status means server reachable
    } catch {
      return false;
    }
  }).current;

  const tickRef = useRef<number | null>(null);

  const startHeartbeat = () => {
    if (tickRef.current !== null) return;
    tickRef.current = window.setInterval(async () => {
      const ok = await probe();
      if (ok) {
        if (stateRef.current !== "online") {
          setState("online");
          setLastOnlineAt(Date.now());
        }
      } else if (stateRef.current === "online") {
        // First failure flips us to reconnecting — give the network a
        // moment to recover before declaring offline. The browser will
        // also dispatch "offline" on its own and we'll catch that.
        setState("reconnecting");
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const stopHeartbeat = () => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onOnline = () => {
      // Browser thinks we're back — verify with a probe.
      void (async () => {
        const ok = await probe();
        if (ok) {
          setState("online");
          setLastOnlineAt(Date.now());
        } else {
          setState("reconnecting");
        }
      })();
    };
    const onOffline = () => setState("offline");

    const onVisibility = () => {
      if (document.visibilityState === "visible" && stateRef.current !== "online") {
        // Tab back in foreground after a while — eagerly probe.
        void (async () => {
          const ok = await probe();
          if (ok) {
            setState("online");
            setLastOnlineAt(Date.now());
          }
        })();
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    startHeartbeat();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      stopHeartbeat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    state,
    lastOnlineAt,
    retry: async () => {
      const ok = await probe();
      if (ok) {
        setState("online");
        setLastOnlineAt(Date.now());
      }
    },
  };
}

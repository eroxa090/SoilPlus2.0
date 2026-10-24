"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoilReading = {
  temp: number;
  ph: number;
  tds: number;
  moist: number;
};

export type SoilSample = SoilReading & { t: number };

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "closed";

type Options = {
  /** Keep this many most-recent samples in the rolling buffer. */
  maxSamples?: number;
  /** Auto-connect when an IP is provided (default true). */
  autoConnect?: boolean;
};

const isReading = (v: unknown): v is SoilReading => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.temp === "number" &&
    typeof o.ph === "number" &&
    typeof o.tds === "number" &&
    typeof o.moist === "number"
  );
};

/**
 * Detach every handler before closing, so a socket we are replacing can't
 * fire a late onclose that clobbers its successor or schedules a reconnect.
 */
function dispose(ws: WebSocket | null) {
  if (!ws) return;
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
  try {
    ws.close();
  } catch {
    /* noop */
  }
}

/**
 * Connects to the ESP32 WebSocket server (ws://<ip>:81/) and keeps a
 * rolling buffer of sensor samples. Reconnects automatically with
 * exponential back-off when the hotspot dips.
 */
export function useSoilSocket(ip: string, opts: Options = {}) {
  const { maxSamples = 60, autoConnect = true } = opts;

  const [status, setStatus] = useState<SocketStatus>("idle");
  const [latest, setLatest] = useState<SoilReading | null>(null);
  const [history, setHistory] = useState<SoilSample[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const hostRef = useRef<string>("");
  const backoffRef = useRef(500);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRunRef = useRef(autoConnect);

  const clearRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const close = useCallback(() => {
    shouldRunRef.current = false;
    clearRetry();
    dispose(wsRef.current);
    wsRef.current = null;
    // A reading from a board we have disconnected from is no longer live.
    setLatest(null);
    setStatus("closed");
  }, []);

  const connect = useCallback(
    (targetIp?: string, isRetry = false) => {
      const hostIp = (targetIp ?? ip).trim();
      if (!hostIp) {
        setError("ESP32 IP address is required");
        setStatus("error");
        return;
      }
      shouldRunRef.current = true;
      clearRetry();
      setError(null);
      setStatus(wsRef.current || isRetry ? "reconnecting" : "connecting");

      // A different board: its old readings must not pass for the new one's.
      if (hostRef.current && hostRef.current !== hostIp) {
        setLatest(null);
        setHistory([]);
      }
      hostRef.current = hostIp;

      dispose(wsRef.current);
      wsRef.current = null;

      const url = `ws://${hostIp}:81/`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to open socket");
        setStatus("error");
        return;
      }
      wsRef.current = ws;

      // Every handler checks it still belongs to the current socket.
      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        backoffRef.current = 500;
        setStatus("connected");
      };

      ws.onmessage = (evt) => {
        if (wsRef.current !== ws) return;
        try {
          const parsed = JSON.parse(evt.data as string);
          if (!isReading(parsed)) return;
          const sample: SoilSample = { ...parsed, t: Date.now() };
          setLatest(parsed);
          setHistory((prev) => {
            const next = prev.length >= maxSamples ? prev.slice(1) : prev.slice();
            next.push(sample);
            return next;
          });
        } catch {
          /* ignore non-JSON handshake frames */
        }
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) return;
        setError("WebSocket error");
        setStatus("error");
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        if (!shouldRunRef.current) {
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
        const delay = Math.min(backoffRef.current, 6000);
        backoffRef.current = Math.min(backoffRef.current * 1.8, 6000);
        retryTimerRef.current = setTimeout(() => connect(hostIp, true), delay);
      };
    },
    [ip, maxSamples],
  );

  // Auto-connect / disconnect on IP change
  useEffect(() => {
    if (!autoConnect) return;
    if (!ip) return;
    connect(ip);
    return () => {
      shouldRunRef.current = false;
      clearRetry();
      dispose(wsRef.current);
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip, autoConnect]);

  return { status, latest, history, error, connect, close };
}

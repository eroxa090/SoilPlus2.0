"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSoilSocket,
  type SoilReading,
  type SoilSample,
  type SocketStatus,
} from "@/hooks/useSoilSocket";

/**
 * SensorProvider keeps a single ESP32 WebSocket connection alive for the
 * entire app — so dashboards, the irrigation calculator, and the AI chat
 * all share the same live reading. It persists the chosen IP to
 * localStorage under "soilplus.ip".
 */

type SensorContextValue = {
  ip: string;
  setIp: (ip: string) => void;
  status: SocketStatus;
  latest: SoilReading | null;
  history: SoilSample[];
  error: string | null;
  connect: (ip?: string) => void;
  close: () => void;
};

const SensorContext = createContext<SensorContextValue | null>(null);

export function SensorProvider({ children }: { children: React.ReactNode }) {
  const [ip, setIpState] = useState<string>("");

  // Restore IP from localStorage on mount
  useEffect(() => {
    const saved = window.localStorage.getItem("soilplus.ip");
    if (saved) setIpState(saved);
  }, []);

  const setIp = useCallback((next: string) => {
    const clean = next.trim();
    setIpState(clean);
    if (clean) window.localStorage.setItem("soilplus.ip", clean);
    else window.localStorage.removeItem("soilplus.ip");
  }, []);

  const { status, latest, history, error, connect, close } = useSoilSocket(ip, {
    maxSamples: 120,
    autoConnect: Boolean(ip),
  });

  const value = useMemo<SensorContextValue>(
    () => ({ ip, setIp, status, latest, history, error, connect, close }),
    [ip, setIp, status, latest, history, error, connect, close],
  );

  return (
    <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
  );
}

export function useSensor() {
  const ctx = useContext(SensorContext);
  if (!ctx) {
    throw new Error("useSensor must be used inside <SensorProvider>");
  }
  return ctx;
}

import type { TradeUpdateEvent } from "@/types/trade.type";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useTradeSocket(
  token: string | null,
  onUpdate: (update: TradeUpdateEvent) => void,
  onError: (message: string) => void,
) {
  const [isConnected, setConnected] = useState(false);

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!token) return;

    const socket = io(`${import.meta.env.VITE_WS_URL}/trades`, {
      auth: { token },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("tradeUpdate", (payload: TradeUpdateEvent) => {
      onUpdateRef.current(payload);
    });

    socket.on("exception", (payload: { message: string }) => {
      onErrorRef.current?.(payload.message);
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      onErrorRef.current?.(err.message);
    });

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [token]);

  return { isConnected };
}

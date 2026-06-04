import { useState, useEffect, useRef, useCallback } from "react";

export function useSDRStream(url) {
  const [data, setData] = useState({
    psd: new Array(128).fill(0),
    constellation: { i: [], q: [] },
    classification: { modulation: "Ninguna", probability: 0 }
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current === null) {
      const ws = new WebSocket(url);
      
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setIsConnected(false);
      };
      
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          console.error("Error parsing WS data", e);
        }
      };

      wsRef.current = ws;
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { data, isConnected, connect, disconnect };
}

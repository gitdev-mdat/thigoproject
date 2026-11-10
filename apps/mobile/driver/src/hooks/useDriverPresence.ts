import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

import { ApiError } from "../services/api";
import { driverApi } from "../services/driver";
import type { DriverLocation, DriverStatus } from "../types/driver";

const HEARTBEAT_MS = 20_000;
const GPS_TIMEOUT_MS = 10_000;

const message = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Chưa cập nhật được trạng thái tài xế.";

function toLocation(location: Location.LocationObject): DriverLocation {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: Math.max(location.coords.accuracy ?? 2_000, 1),
    headingDegrees:
      location.coords.heading !== null && location.coords.heading >= 0
        ? location.coords.heading
        : null,
    speedMetersPerSecond:
      location.coords.speed !== null && location.coords.speed >= 0
        ? location.coords.speed
        : null,
    recordedAt: new Date(location.timestamp).toISOString()
  };
}

async function currentLocation(): Promise<Location.LocationObject> {
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GPS timeout")), GPS_TIMEOUT_MS)
      )
    ]);
  } catch {
    const cached = await Location.getLastKnownPositionAsync({
      maxAge: 120_000,
      requiredAccuracy: 100
    });
    if (cached) return cached;
    throw new Error("GPS unavailable");
  }
}

/** Foreground-only GPS. The server applies its own freshness and write thresholds. */
export function useDriverPresence(activeDelivery: boolean) {
  const [status, setStatus] = useState<DriverStatus>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const posting = useRef(false);

  const reload = useCallback(async () => {
    try {
      setStatus(await driverApi.status());
      setError("");
    } catch (cause) {
      setError(message(cause));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sendLocation = useCallback(
    async (location: Location.LocationObject) => {
      if (posting.current) return;
      posting.current = true;
      try {
        setStatus(await driverApi.presence(true, toLocation(location)));
        setError("");
      } catch (cause) {
        setError(message(cause));
      } finally {
        posting.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!status?.presence?.isOnline) return;
    let disposed = false;
    let watcher: Location.LocationSubscription | undefined;
    const heartbeat = setInterval(() => {
      if (AppState.currentState !== "active" || posting.current) return;
      posting.current = true;
      void driverApi
        .presence(true)
        .then(setStatus)
        .catch((cause) => setError(message(cause)))
        .finally(() => {
          posting.current = false;
        });
    }, HEARTBEAT_MS);
    void Location.getForegroundPermissionsAsync().then(
      async ({ status: permission }) => {
        if (disposed || permission !== "granted") return;
        watcher = await Location.watchPositionAsync(
          {
            accuracy: activeDelivery
              ? Location.Accuracy.High
              : Location.Accuracy.Balanced,
            timeInterval: activeDelivery ? 5_000 : 20_000,
            distanceInterval: activeDelivery ? 15 : 50
          },
          (location) => void sendLocation(location)
        );
        if (disposed) watcher.remove();
      }
    );
    return () => {
      disposed = true;
      clearInterval(heartbeat);
      watcher?.remove();
    };
  }, [activeDelivery, sendLocation, status?.presence?.isOnline]);

  const setOnline = useCallback(
    async (online: boolean) => {
      if (busy) return;
      setBusy(true);
      setError("");
      try {
        if (!online) {
          setStatus(await driverApi.presence(false));
          return;
        }
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setError("Cần quyền vị trí khi dùng ứng dụng để nhận đơn gần bạn.");
          return;
        }
        const location = await currentLocation();
        setStatus(await driverApi.presence(true, toLocation(location)));
      } catch (cause) {
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Chưa lấy được vị trí GPS. Hãy bật vị trí rồi thử lại."
        );
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  return {
    status,
    busy,
    error,
    reload,
    setOnline: (online: boolean) => void setOnline(online)
  };
}

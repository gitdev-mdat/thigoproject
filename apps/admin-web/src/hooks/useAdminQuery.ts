"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdminApiError } from "../services/api";
import { useAdminSession } from "./useAdminSession";

export type QueryState<T> =
  | { status: "loading"; data: T | undefined }
  | { status: "ready"; data: T }
  | { status: "error"; data: T | undefined; message: string };

const errorMessage = (error: unknown) =>
  error instanceof AdminApiError && error.code === "forbidden"
    ? "Tài khoản này không có quyền xem dữ liệu quản trị."
    : error instanceof AdminApiError && error.code === "invalid"
      ? "Bộ lọc không hợp lệ. Hãy đặt lại bộ lọc rồi thử lại."
      : "Không tải được dữ liệu. Kiểm tra API rồi thử lại.";

/**
 * Loads one admin API resource and reloads whenever `key` changes. Earlier
 * data stays visible while the next request runs, so tables do not jump.
 */
export function useAdminQuery<T>(load: () => Promise<T>, key: string) {
  const { expire } = useAdminSession();
  const [state, setState] = useState<QueryState<T>>({
    status: "loading",
    data: undefined
  });
  const loader = useRef(load);
  loader.current = load;
  const request = useRef(0);

  const run = useCallback(async () => {
    const id = ++request.current;
    setState((previous) => ({ status: "loading", data: previous.data }));
    try {
      const data = await loader.current();
      if (id === request.current) setState({ status: "ready", data });
    } catch (error) {
      if (id !== request.current) return;
      if (error instanceof AdminApiError && error.code === "unauthorized")
        return expire();
      setState((previous) => ({
        status: "error",
        data: previous.data,
        message: errorMessage(error)
      }));
    }
  }, [expire]);

  useEffect(() => {
    void run();
  }, [run, key]);

  return { ...state, reload: run };
}

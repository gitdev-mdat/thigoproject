import {
  AuthError,
  DEFAULT_AUTH_TIMEOUT_MS,
  createAuthClient
} from "@thigo/auth-client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CONNECTION_FAILED_MESSAGE, TIMEOUT_MESSAGE } from "./authMessages";
import { createOtpRequest, type OtpRequestPatch } from "./otpRequest";

const PHONE = "0901234567";

/** Folds patches into screen state, the way useAuthSession applies them. */
function harness(fetch: typeof globalThis.fetch) {
  const state: Required<Omit<OtpRequestPatch, "step">> & {
    step: "phone" | "otp";
  } = {
    busy: false,
    error: "",
    notice: "",
    otp: "",
    step: "phone",
    cooldown: 0
  };
  const client = createAuthClient({
    baseUrl: "http://api",
    mode: "bearer",
    fetch
  });
  const request = createOtpRequest({
    send: (phone) => client.requestOtp(phone, "CUSTOMER"),
    apply: (patch) => Object.assign(state, patch),
    cooldownSeconds: 60
  });
  return { state, request };
}

const accepted = () =>
  new Response(JSON.stringify({ accepted: true }), { status: 200 });

describe("OTP request (Gửi mã OTP)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears loading and explains a refused connection, then recovers on retry", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(accepted());
    const { state, request } = harness(fetch);

    const first = request(PHONE);
    expect(state.busy).toBe(true);
    await first;
    expect(state).toMatchObject({
      busy: false,
      error: CONNECTION_FAILED_MESSAGE,
      step: "phone",
      cooldown: 0
    });

    await request(PHONE);
    expect(state).toMatchObject({
      busy: false,
      error: "",
      step: "otp",
      cooldown: 60
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("stops loading after the timeout when the API never answers, then recovers", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError"))
            )
          )
      )
      .mockResolvedValueOnce(accepted());
    const { state, request } = harness(fetch);

    const first = request(PHONE);
    await vi.advanceTimersByTimeAsync(DEFAULT_AUTH_TIMEOUT_MS - 1);
    expect(state.busy).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    await first;
    expect(state).toMatchObject({
      busy: false,
      error: TIMEOUT_MESSAGE,
      step: "phone",
      cooldown: 0
    });

    await request(PHONE);
    expect(state).toMatchObject({ busy: false, step: "otp", cooldown: 60 });
  });

  it("sends one request for repeated taps while one is in flight", async () => {
    let answer: (response: Response) => void = () => undefined;
    const fetch = vi.fn(
      () => new Promise<Response>((resolve) => (answer = resolve))
    );
    const { state, request } = harness(fetch);

    const taps = [request(PHONE), request(PHONE), request(PHONE)];
    await Promise.resolve();
    answer(accepted());
    await Promise.all(taps);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(state).toMatchObject({ busy: false, step: "otp", cooldown: 60 });
    // Settled requests release the guard: a later resend is sent.
    fetch.mockResolvedValueOnce(accepted());
    await request(PHONE);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the server's resend cooldown answer and does not start a countdown", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 400 }));
    const { state, request } = harness(fetch);
    await request(PHONE);
    expect(state.busy).toBe(false);
    expect(state.cooldown).toBe(0);
    expect(state.error).toMatch(/đợi giây lát/);
  });

  it("does not contact the API for an invalid phone", async () => {
    const fetch = vi.fn();
    const { state, request } = harness(fetch);
    await request("12345");
    expect(fetch).not.toHaveBeenCalled();
    expect(state.busy).toBe(false);
    expect(state.error).toBe("Số chưa hợp lệ. Ví dụ: 0901 234 567.");
  });

  it("maps auth-client failures to Vietnamese messages", async () => {
    const { authErrorMessage } = await import("./authMessages");
    expect(authErrorMessage(new AuthError("network"), "request")).toBe(
      CONNECTION_FAILED_MESSAGE
    );
    expect(authErrorMessage(new AuthError("timeout"), "verify")).toBe(
      TIMEOUT_MESSAGE
    );
    expect(authErrorMessage(new Error("boom"), "request")).toBe(
      CONNECTION_FAILED_MESSAGE
    );
  });
});

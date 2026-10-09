"use client";

import { useEffect, useRef, useState } from "react";

export type Decision = "approve" | "request-changes" | "reject";

const COPY: Record<
  Decision,
  { title: string; confirm: string; busy: string; tone: "primary" | "danger" }
> = {
  approve: {
    title: "Duyệt hồ sơ đối tác",
    confirm: "Duyệt và cấp quyền",
    busy: "Đang duyệt…",
    tone: "primary"
  },
  "request-changes": {
    title: "Yêu cầu chủ quán bổ sung",
    confirm: "Gửi yêu cầu bổ sung",
    busy: "Đang gửi…",
    tone: "primary"
  },
  reject: {
    title: "Từ chối hồ sơ",
    confirm: "Từ chối hồ sơ",
    busy: "Đang từ chối…",
    tone: "danger"
  }
};

/**
 * A native modal dialog (focus trap, Escape to cancel) for one decision.
 * Changes and rejection need a reason the applicant will read.
 */
export function DecisionDialog({
  decision,
  consequence,
  busy,
  error,
  onCancel,
  onConfirm
}: {
  decision: Decision;
  consequence: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const needsReason = decision !== "approve";
  const reasonError =
    needsReason && reason.trim().length < 5
      ? "Nhập lý do (ít nhất 5 ký tự) để chủ quán biết cần làm gì."
      : "";
  const copy = COPY[decision];

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby="decision-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (reasonError) return;
          onConfirm(reason.trim());
        }}
      >
        <h2 id="decision-title">{copy.title}</h2>
        <p className="muted">{consequence}</p>
        {needsReason ? (
          <label className="field">
            <span>Lý do gửi cho chủ quán</span>
            <textarea
              value={reason}
              rows={4}
              maxLength={500}
              autoFocus
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={touched && !!reasonError}
            />
            <span className="small muted">{reason.trim().length}/500</span>
            {touched && reasonError ? (
              <span className="error small">{reasonError}</span>
            ) : null}
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="notice notice-danger">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Quay lại
          </button>
          <button
            type="submit"
            className={`button ${copy.tone === "danger" ? "destructive" : "primary"}`}
            disabled={busy}
          >
            {busy ? copy.busy : copy.confirm}
          </button>
        </div>
      </form>
    </dialog>
  );
}

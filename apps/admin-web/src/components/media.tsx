"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { imageSrc, loadPrivateImage } from "../services/api";
import type { StoreCategory } from "../types/admin";
import { CATEGORY_LABEL } from "./format";
import { Icon } from "./ui";

/** A calm, branded stand-in when a store or product has no image yet. */
export function ImagePlaceholder({
  label,
  category,
  size = "md"
}: {
  label: string;
  category?: StoreCategory | undefined;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={`image-placeholder size-${size}`} aria-hidden="true">
      <span className="image-placeholder-initial">
        {label.trim().charAt(0).toUpperCase() || "T"}
      </span>
      {category && size !== "sm" ? (
        <span className="image-placeholder-caption">
          {CATEGORY_LABEL[category]}
        </span>
      ) : null}
    </div>
  );
}

/** Public catalog image (store or product), with a placeholder fallback. */
export function CatalogImage({
  url,
  alt,
  fallback,
  className = ""
}: {
  url: string | null | undefined;
  alt: string;
  fallback: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(url);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * A private application image, fetched with the Admin session. Shows a
 * neutral frame while loading and a clear message when the file is missing.
 */
export function PrivateImage({
  url,
  alt,
  className = ""
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; src: string }
    | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    setState({ status: "loading" });
    loadPrivateImage(url)
      .then((src) => {
        objectUrl = src;
        if (cancelled) URL.revokeObjectURL(src);
        else setState({ status: "ready", src });
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (state.status === "ready")
    return <img className={className} src={state.src} alt={alt} />;
  return (
    <div
      className={`private-image-state ${className}`}
      role={state.status === "error" ? "img" : undefined}
      aria-label={
        state.status === "error" ? `${alt}: không tải được` : undefined
      }
      aria-busy={state.status === "loading"}
    >
      {state.status === "error" ? (
        <>
          <Icon name="alert" size={18} />
          <span className="small">Không tải được ảnh</span>
        </>
      ) : (
        <span className="spinner" aria-hidden="true" />
      )}
    </div>
  );
}

/** Large image preview in a native modal dialog (Escape closes it). */
export function Lightbox({
  title,
  caption,
  onClose,
  children
}: {
  title: string;
  caption?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="lightbox-frame">
        <div className="lightbox-head">
          <strong>{title}</strong>
          <button
            type="button"
            className="button icon"
            onClick={onClose}
            aria-label="Đóng xem ảnh"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="lightbox-body">{children}</div>
        {caption ? <div className="lightbox-caption">{caption}</div> : null}
      </div>
    </dialog>
  );
}

export type JourneyStep = {
  key: string;
  label: string;
  detail?: string;
  state: "done" | "current" | "todo" | "blocked";
};

/** The partner's real progress from application to selling. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="journey" aria-label="Tiến trình đối tác">
      {steps.map((step, index) => (
        <li key={step.key} className={`journey-step is-${step.state}`}>
          <span className="journey-marker" aria-hidden="true">
            {step.state === "done" ? (
              <Icon name="check" size={14} />
            ) : step.state === "blocked" ? (
              <Icon name="close" size={14} />
            ) : (
              index + 1
            )}
          </span>
          <span className="journey-text">
            <span className="journey-label">{step.label}</span>
            {step.detail ? (
              <span className="journey-detail">{step.detail}</span>
            ) : null}
          </span>
          <span className="sr-only">
            {step.state === "done"
              ? "đã xong"
              : step.state === "current"
                ? "đang ở bước này"
                : step.state === "blocked"
                  ? "dừng lại"
                  : "chưa tới"}
          </span>
        </li>
      ))}
    </ol>
  );
}

import type { JourneyStep } from "../media";
import type { ApplicationStatus } from "../../types/admin";

type Progress = {
  status: ApplicationStatus;
  activatedAt: string | null;
  store: { isPublished: boolean; availableProductCount: number } | null;
};

/**
 * The five real stages from application to selling. Each stage is derived
 * from stored data only: the application status, its activation and the
 * store's live catalog and publication.
 */
export function partnerJourney(progress: Progress): JourneyStep[] {
  const { status, activatedAt, store } = progress;
  const submitted = status !== "DRAFT";
  const decided = status === "APPROVED" || status === "REJECTED";
  const active = activatedAt !== null;
  const hasMenu = (store?.availableProductCount ?? 0) > 0;
  const selling = store?.isPublished === true && hasMenu;
  const state = (done: boolean, current: boolean): JourneyStep["state"] =>
    done ? "done" : current ? "current" : "todo";
  return [
    {
      key: "submit",
      label: "Gửi hồ sơ",
      ...(status === "DRAFT" ? { detail: "Đang soạn" } : {}),
      state: state(submitted, status === "DRAFT")
    },
    {
      key: "review",
      label: "Xét duyệt",
      ...(status === "CHANGES_REQUESTED"
        ? { detail: "Chờ chủ quán bổ sung" }
        : status === "REJECTED"
          ? { detail: "Đã từ chối" }
          : {}),
      state:
        status === "REJECTED"
          ? "blocked"
          : state(
              decided,
              status === "PENDING_REVIEW" || status === "CHANGES_REQUESTED"
            )
    },
    {
      key: "activate",
      label: "Kích hoạt",
      ...(status === "APPROVED" && !active
        ? { detail: "Chờ chủ quán đăng nhập" }
        : {}),
      state: state(active, status === "APPROVED" && !active)
    },
    {
      key: "menu",
      label: "Thực đơn",
      ...(active && !hasMenu ? { detail: "Chưa có món đang bán" } : {}),
      state: state(hasMenu, active && !hasMenu)
    },
    {
      key: "selling",
      label: "Mở bán",
      ...(hasMenu && !selling ? { detail: "Chưa hiển thị" } : {}),
      state: state(selling, hasMenu && !selling)
    }
  ];
}

/** One short label for list views. */
export function partnerStage(progress: Progress): {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
} {
  const { status, activatedAt, store } = progress;
  if (status === "DRAFT") return { label: "Đang soạn hồ sơ", tone: "neutral" };
  if (status === "PENDING_REVIEW")
    return { label: "Chờ duyệt", tone: "warning" };
  if (status === "CHANGES_REQUESTED")
    return { label: "Chờ chủ quán bổ sung", tone: "info" };
  if (status === "REJECTED") return { label: "Đã từ chối", tone: "danger" };
  if (!activatedAt) return { label: "Chờ kích hoạt", tone: "warning" };
  if (!store || store.availableProductCount === 0)
    return { label: "Chưa có thực đơn", tone: "info" };
  if (!store.isPublished) return { label: "Chưa mở bán", tone: "info" };
  return { label: "Đang bán", tone: "success" };
}

import { ConfirmSheet } from "./ConfirmSheet";

type Props = {
  visible: boolean;
  onStay: () => void;
  onDiscard: () => void;
};

/** Confirms leaving a form with unsaved edits. */
export function DiscardChangesSheet({ visible, onStay, onDiscard }: Props) {
  return (
    <ConfirmSheet
      visible={visible}
      title="Bỏ thay đổi?"
      body="Những thay đổi bạn vừa nhập chưa được lưu và sẽ mất nếu rời màn hình này."
      confirmLabel="Bỏ thay đổi"
      loadingLabel="Đang thoát…"
      cancelLabel="Tiếp tục sửa"
      destructive
      busy={false}
      onCancel={onStay}
      onConfirm={onDiscard}
    />
  );
}

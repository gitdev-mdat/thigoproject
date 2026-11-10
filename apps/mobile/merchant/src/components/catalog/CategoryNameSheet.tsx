import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { Button } from "../Button";
import { Sheet } from "../Sheet";
import { TextField } from "../TextField";

type Props = {
  visible: boolean;
  /** Present when renaming; absent when creating. */
  initialName?: string | undefined;
  busy: boolean;
  error?: string | undefined;
  onCancel: () => void;
  onSubmit: (name: string) => void;
};

const MAX = 80;

/** Name a new category or rename an existing one. */
export function CategoryNameSheet({
  visible,
  initialName,
  busy,
  error,
  onCancel,
  onSubmit
}: Props) {
  const renaming = initialName !== undefined;
  const [name, setName] = useState(initialName ?? "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
      setLocalError("");
    }
  }, [visible, initialName]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setLocalError("Nhập tên danh mục.");
    if (trimmed.length > MAX)
      return setLocalError(`Tên danh mục tối đa ${MAX} ký tự.`);
    onSubmit(trimmed);
  };

  return (
    <Sheet
      visible={visible}
      title={renaming ? "Đổi tên danh mục" : "Thêm danh mục"}
      onClose={onCancel}
      locked={busy}
      footer={
        <>
          <Button
            label="Huỷ"
            variant="secondary"
            disabled={busy}
            onPress={onCancel}
            style={styles.action}
          />
          <Button
            label={renaming ? "Lưu tên" : "Tạo danh mục"}
            loadingLabel="Đang lưu…"
            loading={busy}
            onPress={submit}
            style={styles.action}
          />
        </>
      }
    >
      <TextField
        label="Tên danh mục"
        placeholder="Ví dụ: Món chính, Đồ uống, Món thêm"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setLocalError("");
        }}
        maxLength={MAX}
        autoFocus
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!busy}
        error={localError || error}
        helper="Khách thấy danh mục theo thứ tự bạn sắp xếp."
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({ action: { flex: 1 } });

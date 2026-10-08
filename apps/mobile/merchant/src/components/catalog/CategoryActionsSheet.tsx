import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors, sizes, spacing, typography } from "@thigo/design-tokens";

import type { MerchantCategory, MoveDirection } from "../../types/storefront";
import { Button } from "../Button";
import { Icon, type IconName } from "../Icon";
import { Notice } from "../Notice";
import { Sheet } from "../Sheet";

export type CategoryAction = "visibility" | "up" | "down" | "delete";

type Props = {
  category: MerchantCategory | null;
  index: number;
  count: number;
  pending: CategoryAction | null;
  error?: string | undefined;
  onClose: () => void;
  onRename: () => void;
  onToggleVisible: () => void;
  onMove: (direction: MoveDirection) => void;
  onDelete: () => void;
};

/** Manage one category: rename, hide/show, reorder and delete. */
export function CategoryActionsSheet({
  category,
  index,
  count,
  pending,
  error,
  onClose,
  onRename,
  onToggleVisible,
  onMove,
  onDelete
}: Props) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!category) setConfirming(false);
  }, [category]);
  const busy = pending !== null;
  const productCount = category?.products.length ?? 0;

  const row = (
    key: string,
    icon: IconName,
    label: string,
    description: string | undefined,
    onPress: () => void,
    options: {
      disabled?: boolean;
      danger?: boolean;
      action?: CategoryAction;
    } = {}
  ) => {
    const disabled = busy || options.disabled === true;
    const loading = options.action !== undefined && pending === options.action;
    const tint = options.disabled
      ? colors.text.disabled
      : options.danger
        ? colors.status.danger
        : colors.text.primary;
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityState={{ disabled, busy: loading }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.brand.primary} />
          ) : (
            <Icon name={icon} color={tint} />
          )}
        </View>
        <View style={styles.text}>
          <Text style={[styles.label, { color: tint }]}>{label}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Sheet
      visible={category !== null}
      title={confirming ? "Xoá danh mục?" : (category?.name ?? "")}
      onClose={onClose}
      locked={busy}
      footer={
        confirming ? (
          <>
            <Button
              label="Giữ danh mục"
              variant="secondary"
              disabled={busy}
              onPress={() => setConfirming(false)}
              style={styles.action}
            />
            <Button
              label="Xoá danh mục"
              loadingLabel="Đang xoá…"
              variant="destructive"
              loading={pending === "delete"}
              onPress={onDelete}
              style={styles.action}
            />
          </>
        ) : (
          <Button
            label="Đóng"
            variant="secondary"
            disabled={busy}
            onPress={onClose}
            style={styles.action}
          />
        )
      }
    >
      {confirming ? (
        <Text style={styles.body}>
          Danh mục “{category?.name}” sẽ bị xoá khỏi thực đơn. Chỉ xoá được danh
          mục không còn món nào.
        </Text>
      ) : (
        <View>
          {row("rename", "list", "Đổi tên", undefined, onRename)}
          {category
            ? row(
                "visibility",
                "store",
                category.isActive ? "Ẩn danh mục" : "Hiện danh mục",
                category.isActive
                  ? "Khách sẽ không thấy danh mục và các món trong đó."
                  : "Khách sẽ thấy lại danh mục và các món đang bán.",
                onToggleVisible,
                { action: "visibility" }
              )
            : null}
          {row("up", "up", "Chuyển lên", undefined, () => onMove("up"), {
            disabled: index <= 0,
            action: "up"
          })}
          {row(
            "down",
            "down",
            "Chuyển xuống",
            undefined,
            () => onMove("down"),
            {
              disabled: index >= count - 1,
              action: "down"
            }
          )}
          {row(
            "delete",
            "close",
            "Xoá danh mục",
            productCount
              ? `Còn ${productCount} món. Hãy chuyển hoặc xoá các món trước, hoặc ẩn danh mục.`
              : undefined,
            () => setConfirming(true),
            { danger: true }
          )}
        </View>
      )}
      {error ? <Notice message={error} tone="danger" /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: sizes.control.prominent,
    paddingVertical: spacing.xs
  },
  pressed: { backgroundColor: colors.action.secondaryPressed },
  icon: {
    width: sizes.icon.large,
    alignItems: "center",
    justifyContent: "center"
  },
  text: { flex: 1, gap: spacing.xxs },
  label: {
    ...typography.role.body,
    fontWeight: typography.role.label.fontWeight
  },
  description: {
    ...typography.role.bodySecondary,
    color: colors.text.secondary
  },
  body: { ...typography.role.body, color: colors.text.primary },
  action: { flex: 1 }
});

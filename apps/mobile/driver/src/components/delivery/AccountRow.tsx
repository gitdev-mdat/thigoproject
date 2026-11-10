import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@thigo/design-tokens";

import { maskPhone } from "../../utils/phone";
import { Button } from "../Button";

type Props = {
  phone?: string | undefined;
  busy: boolean;
  onLogout: () => void;
};

/** Account and sign-out, kept at the end of the screen away from job actions. */
export function AccountRow({ phone, busy, onLogout }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.caption}>Tài khoản Tài xế</Text>
        <Text style={styles.phone}>{phone ? maskPhone(phone) : ""}</Text>
      </View>
      <Button
        label="Đăng xuất"
        loadingLabel="Đang đăng xuất…"
        variant="secondary"
        loading={busy}
        onPress={onLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary
  },
  text: { flex: 1, gap: spacing.xxs },
  caption: { ...typography.role.caption, color: colors.text.secondary },
  phone: {
    ...typography.role.itemTitle,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"]
  }
});

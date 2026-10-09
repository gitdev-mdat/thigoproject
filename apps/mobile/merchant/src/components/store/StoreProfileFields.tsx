import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@thigo/design-tokens";

import type { StoreCategory } from "../../types/storefront";
import {
  STORE_CATEGORIES,
  type StoreProfileDraft,
  type StoreProfileErrors
} from "../../utils/storefront";
import { FieldMessage } from "../FieldMessage";
import { SelectChip } from "../SelectChip";
import { TextField } from "../TextField";

type Props = {
  draft: StoreProfileDraft;
  errors: StoreProfileErrors;
  editable: boolean;
  onChange: (patch: Partial<StoreProfileDraft>) => void;
};

const DESCRIPTION_MAX = 500;

/** The store's identity fields, shared by first-time setup and editing. */
export function StoreProfileFields({
  draft,
  errors,
  editable,
  onChange
}: Props) {
  return (
    <View style={styles.fields}>
      <TextField
        label="Tên cửa hàng"
        placeholder="Ví dụ: Cơm Tấm Cô Ba"
        value={draft.name}
        onChangeText={(name) => onChange({ name })}
        maxLength={120}
        autoCapitalize="words"
        editable={editable}
        error={errors.name}
      />
      <View style={styles.group} accessibilityRole="radiogroup">
        <Text style={styles.label}>Loại cửa hàng</Text>
        <View style={styles.chips}>
          {STORE_CATEGORIES.map((item) => (
            <SelectChip
              key={item.value}
              label={item.label}
              selected={draft.category === item.value}
              disabled={!editable}
              onPress={() =>
                onChange({ category: item.value as StoreCategory })
              }
            />
          ))}
        </View>
        {errors.category ? <FieldMessage error={errors.category} /> : null}
      </View>
      <TextField
        label="Địa chỉ cửa hàng"
        placeholder="Số nhà, đường, phường, quận"
        value={draft.addressLine}
        onChangeText={(addressLine) => onChange({ addressLine })}
        maxLength={255}
        editable={editable}
        error={errors.addressLine}
        helper="Tài xế dùng địa chỉ này để đến lấy món."
      />
      <TextField
        label="Số điện thoại cửa hàng"
        placeholder="0901 234 567"
        value={draft.phone}
        onChangeText={(phone) => onChange({ phone })}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={16}
        editable={editable}
        error={errors.phone}
        helper="Số để THIGO và tài xế liên hệ khi cần."
      />
      <TextField
        label="Giới thiệu ngắn (không bắt buộc)"
        placeholder="Món đặc trưng, phong cách quán…"
        value={draft.description}
        onChangeText={(description) => onChange({ description })}
        maxLength={DESCRIPTION_MAX}
        multiline
        editable={editable}
        error={errors.description}
        helper={`${draft.description.length}/${DESCRIPTION_MAX} ký tự`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  group: { gap: spacing.xs },
  label: { ...typography.role.label, color: colors.text.primary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }
});

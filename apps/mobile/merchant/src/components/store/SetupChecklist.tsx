import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { SetupStep, SetupStepKey } from "../../types/storefront";
import { setupProgress } from "../../utils/storefront";
import { Button } from "../Button";
import { Card } from "../Card";
import { Icon } from "../Icon";

export type SetupAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  /** Explains a disabled action next to it. */
  reason?: string | undefined;
};

type Props = {
  steps: SetupStep[];
  actionFor: (key: SetupStepKey) => SetupAction | undefined;
};

/** Server-defined setup steps with one direct action per unfinished step. */
export function SetupChecklist({ steps, actionFor }: Props) {
  const progress = setupProgress(steps);
  return (
    <Card
      title="Hoàn tất thiết lập"
      subtitle={`Đã xong ${progress.done}/${progress.total} bước`}
    >
      <View style={styles.track} accessible={false}>
        <View
          style={[
            styles.fill,
            { width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }
          ]}
        />
      </View>
      {steps.map((step) => {
        const action = step.done ? undefined : actionFor(step.key);
        return (
          <View key={step.key} style={styles.step}>
            <View
              style={[styles.mark, step.done && styles.markDone]}
              accessible={false}
            >
              {step.done ? (
                <Icon
                  name="check"
                  size={sizes.icon.small}
                  color={colors.text.inverse}
                />
              ) : null}
            </View>
            <View style={styles.stepBody}>
              <Text
                style={[styles.stepLabel, step.done && styles.stepDone]}
                accessibilityLabel={`${step.label}${step.required ? "" : " (không bắt buộc)"}: ${step.done ? "đã xong" : "chưa xong"}`}
              >
                {step.label}
                {step.required ? "" : " · Không bắt buộc"}
              </Text>
              {action ? (
                <>
                  <Button
                    label={action.label}
                    variant="secondary"
                    disabled={action.disabled ?? false}
                    loading={action.loading ?? false}
                    {...(action.loadingLabel
                      ? { loadingLabel: action.loadingLabel }
                      : {})}
                    onPress={action.onPress}
                    style={styles.action}
                  />
                  {action.reason ? (
                    <Text style={styles.reason}>{action.reason}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const MARK = sizes.icon.large;

const styles = StyleSheet.create({
  track: {
    height: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface.secondary,
    overflow: "hidden"
  },
  fill: { height: "100%", backgroundColor: colors.brand.primary },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxs
  },
  markDone: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary
  },
  stepBody: { flex: 1, gap: spacing.xs, paddingVertical: spacing.xxs },
  stepLabel: { ...typography.role.body, color: colors.text.primary },
  stepDone: { color: colors.text.secondary },
  action: { alignSelf: "flex-start" },
  reason: { ...typography.role.bodySecondary, color: colors.text.secondary }
});

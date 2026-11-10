import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  radius,
  sizes,
  spacing,
  typography
} from "@thigo/design-tokens";

import type { MerchantStoreProfile } from "../../types/storefront";
import { initialOf, storeCategoryLabel } from "../../utils/storefront";
import { Icon } from "../Icon";
import { RemoteImage } from "../RemoteImage";

type Props = { store: MerchantStoreProfile };

const LOGO = 64;

/** Cover, logo and name; brand-tinted fallbacks keep it composed without images. */
export function StoreIdentity({ store }: Props) {
  return (
    <View style={styles.wrap}>
      <RemoteImage
        url={store.coverImageUrl}
        style={styles.cover}
        fallback={
          <View style={styles.coverFallback}>
            <Icon
              name="store"
              size={sizes.icon.large}
              color={colors.text.link}
            />
          </View>
        }
      />
      <View style={styles.body}>
        <View style={styles.logoRing}>
          <RemoteImage
            url={store.logoImageUrl}
            style={styles.logo}
            fallback={
              <View style={styles.logoFallback}>
                <Text style={styles.initial}>{initialOf(store.name)}</Text>
              </View>
            }
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.name} accessibilityRole="header">
            {store.name}
          </Text>
          <Text style={styles.meta}>
            {storeCategoryLabel(store.category)} · {store.addressLine}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    overflow: "hidden"
  },
  cover: { width: "100%", aspectRatio: 16 / 7 },
  coverFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primarySubtle
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    marginTop: -LOGO / 2
  },
  logoRing: {
    padding: spacing.xxs,
    borderRadius: radius.large,
    backgroundColor: colors.surface.primary
  },
  logo: { width: LOGO, height: LOGO, borderRadius: radius.medium },
  logoFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary
  },
  initial: { ...typography.role.screenTitle, color: colors.text.inverse },
  text: { flex: 1, gap: spacing.xxs, paddingTop: LOGO / 2 },
  name: { ...typography.role.sectionTitle, color: colors.text.primary },
  meta: { ...typography.role.bodySecondary, color: colors.text.secondary }
});

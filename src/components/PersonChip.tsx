import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, tints } from "@/theme/tokens";

import { Avatar } from "./Avatar";

type Props = {
  initial: string;
  name: string;
  // When provided, renders an "×" remove button on the right and
  // calls this on tap. Without it, the chip is decorative-only.
  onRemove?: () => void;
};

// Brass-tinted "selected person" chip used inline in the People
// picker's selected row. Always reads as "active" — appears only
// when this person is selected. The tappable "×" removes them.
export function PersonChip({ initial, name, onRemove }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.chip}>
      <Avatar initial={initial} size={22} accent="brass" />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t("personChip.removeA11y", { name })}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed && styles.removePressed,
          ]}
        >
          <SymbolView
            name="xmark"
            tintColor={colors.text3}
            size={10}
            weight="semibold"
            resizeMode="scaleAspectFit"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 10,
    borderRadius: radii.pill,
    backgroundColor: tints.brassFill,
    borderWidth: 1,
    borderColor: tints.brassEdge,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
    maxWidth: 140,
  },
  removeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  removePressed: {
    backgroundColor: colors.surface2,
  },
});

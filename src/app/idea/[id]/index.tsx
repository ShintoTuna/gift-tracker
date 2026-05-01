import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Avatar, Card, Label, NavBar, Pill } from "@/components";
import { formatPrice, shortenSource } from "@/lib/format";
import { thumbColorForSeed } from "@/lib/seedColor";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Read-only view for a single gift idea. Shows the image, title,
// status, tagged people, description, source/price, and the giving
// history. Edit/Delete + giving management live on the edit modal,
// pushed via the trailing "Edit" pill.
export default function ViewIdeaScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = id as Id<"giftIdeas">;
  const idea = useQuery(api.giftIdeas.getById, { id: ideaId });
  const people = useQuery(api.people.list);
  const givings = useQuery(api.giftGivings.listByIdea, {
    giftIdeaId: ideaId,
  });

  if (idea === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("ideaView.title")}
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.brass} />
        </View>
      </View>
    );
  }

  if (idea === null) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("ideaView.title")}
          leading="back"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>{t("ideaForm.notFound")}</Text>
      </View>
    );
  }

  const placeholderColor = thumbColorForSeed(idea._id);
  const taggedPeople = (people ?? []).filter((p) =>
    idea.taggedPeople.includes(p._id),
  );
  const sourceLabel = shortenSource(idea.sourceUrl);
  const priceLabel = formatPrice(idea.priceEstimate, idea.currency);
  const description = idea.description?.trim();

  const onOpenSource = () => {
    if (!idea.sourceUrl) return;
    void Linking.openURL(idea.sourceUrl).catch(() => {});
  };

  const onEdit = () => {
    router.push({
      pathname: "/idea/[id]/edit",
      params: { id: idea._id },
    });
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("ideaView.title")}
        leading="back"
        onLeadingPress={() => router.back()}
        trailing={
          <Pressable
            onPress={onEdit}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t("ideaView.editA11y")}
          >
            <Pill>{t("ideaView.editPill")}</Pill>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image — full-width square so the captured photo is
            the visual anchor of the screen. Falls back to the same
            deterministic placeholder used on the card. */}
        <View style={styles.heroWrap}>
          {idea.imageUrl ? (
            <Image
              source={{ uri: idea.imageUrl }}
              style={styles.hero}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <View style={[styles.hero, { backgroundColor: placeholderColor }]}>
              <LinearGradient
                colors={["rgba(255,255,255,0.07)", "rgba(0,0,0,0.18)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{idea.title}</Text>

          <View style={styles.statusRow}>
            <Pill tone={idea.status === "archived" ? "default" : "brass"}>
              {idea.status === "archived"
                ? t("ideaForm.statusArchived")
                : t("ideaForm.statusActive")}
            </Pill>
          </View>

          {(sourceLabel || priceLabel) && (
            <View style={styles.metaRow}>
              {sourceLabel && (
                <Pressable
                  onPress={onOpenSource}
                  hitSlop={6}
                  accessibilityRole="link"
                  accessibilityLabel={t("ideaView.openSourceA11y")}
                >
                  <Text style={styles.sourceLink}>{sourceLabel}</Text>
                </Pressable>
              )}
              {priceLabel ? (
                <Text style={styles.price}>{priceLabel}</Text>
              ) : null}
            </View>
          )}

          {description && (
            <View style={styles.section}>
              <Label style={styles.sectionLabel}>
                {t("ideaView.descriptionLabel")}
              </Label>
              <Card>
                <Text style={styles.descriptionText}>{description}</Text>
              </Card>
            </View>
          )}

          {taggedPeople.length > 0 && (
            <View style={styles.section}>
              <Label style={styles.sectionLabel}>
                {t("ideaView.peopleLabel")}
              </Label>
              <Card padding={0}>
                {taggedPeople.map((p, idx) => (
                  <Pressable
                    key={p._id}
                    onPress={() =>
                      router.push({
                        pathname: "/people/[id]",
                        params: { id: p._id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={p.nickname ?? p.name}
                    style={({ pressed }) => [
                      styles.personRow,
                      idx < taggedPeople.length - 1 && styles.personRowDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Avatar
                      initial={p.name[0]?.toUpperCase() ?? "?"}
                      imageUrl={p.photoUrl}
                      size={22}
                    />
                    <Text style={styles.personName} numberOfLines={1}>
                      {p.nickname ?? p.name}
                    </Text>
                    {p.relationship ? (
                      <Text style={styles.personMeta} numberOfLines={1}>
                        {p.relationship}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Label style={styles.sectionLabel}>
              {t("ideaForm.givingsTitle")}
            </Label>
            {givings && givings.length > 0 ? (
              <Card padding={0}>
                {givings.map((g, idx) => {
                  const dateText = dateFormatter.format(new Date(g.givenAt));
                  const personLabel =
                    g.personNickname ?? g.personName ?? "—";
                  return (
                    <View
                      key={g._id}
                      style={[
                        styles.givingRow,
                        idx < givings.length - 1 && styles.givingRowDivider,
                      ]}
                    >
                      <Avatar
                        initial={
                          (g.personName ?? g.personNickname ?? "?")[0]
                            ?.toUpperCase() ?? "?"
                        }
                        size={22}
                      />
                      <View style={styles.givingTextWrap}>
                        <Text style={styles.givingPrimary} numberOfLines={1}>
                          {personLabel} · {dateText}
                        </Text>
                        {g.occasionTitle && (
                          <Text
                            style={styles.givingSecondary}
                            numberOfLines={1}
                          >
                            {g.occasionTitle}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>
            ) : (
              <Text style={styles.givingsEmpty}>
                {t("ideaForm.givingsEmpty")}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  hero: {
    aspectRatio: 1,
    width: "100%",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  body: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  statusRow: {
    flexDirection: "row",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  sourceLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.brass,
  },
  price: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  personRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    flexShrink: 1,
  },
  personMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    marginLeft: "auto",
    flexShrink: 1,
  },
  givingsEmpty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
  },
  givingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  givingRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  givingTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  givingPrimary: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  givingSecondary: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});

import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Avatar, Btn, Card, Label, NavBar, Pill } from "@/components";
import DateTimePicker from "@/components/internal/DateTimePicker";
import { notify } from "@/lib/alerts";
import { describeMutationError } from "@/lib/convexErrors";
import { formatPrice, shortenSource } from "@/lib/format";
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
// history. Edit/Delete + per-giving removal live on the edit modal,
// pushed via the trailing "Edit" pill. The "Mark as given" CTA opens
// a lightweight sheet so users can record a giving in one tap
// without diving into the full edit form.
export default function ViewIdeaScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = id as Id<"giftIdeas">;
  const idea = useQuery(api.giftIdeas.getById, { id: ideaId });
  const people = useQuery(api.people.list);
  const givings = useQuery(api.giftGivings.listByIdea, {
    giftIdeaId: ideaId,
  });
  const addGiving = useMutation(api.giftGivings.addGiving);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [givingPersonId, setGivingPersonId] =
    useState<Id<"people"> | null>(null);
  const [givingDate, setGivingDate] = useState<Date>(new Date());
  const [givingOccasionId, setGivingOccasionId] =
    useState<Id<"occasions"> | null>(null);
  const [givingDateOpen, setGivingDateOpen] = useState(false);
  const [savingGiving, setSavingGiving] = useState(false);

  const occasionsForPerson = useQuery(
    api.occasions.listByPerson,
    givingPersonId ? { personId: givingPersonId } : "skip",
  );

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

  const taggedPeople = (people ?? []).filter((p) =>
    idea.taggedPeople.includes(p._id),
  );
  const sourceLabel = shortenSource(idea.sourceUrl);
  const priceLabel = formatPrice(idea.priceEstimate, idea.currency);
  const description = idea.description?.trim();
  const hasPeople = (people?.length ?? 0) > 0;

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

  const openGivingSheet = () => {
    if (!hasPeople) return;
    // Pre-select the first tagged person so the common one-person
    // case is a single-tap confirmation. Falls back to the first
    // person in the user's address book otherwise.
    const preselect =
      idea.taggedPeople[0] ?? (people && people[0]?._id) ?? null;
    setGivingPersonId(preselect);
    setGivingDate(new Date());
    setGivingOccasionId(null);
    setGivingDateOpen(false);
    setSheetOpen(true);
  };

  const closeGivingSheet = () => {
    setSheetOpen(false);
    setGivingDateOpen(false);
  };

  const onSelectPerson = (pid: Id<"people">) => {
    setGivingPersonId(pid);
    setGivingOccasionId(null);
  };

  const onSaveGiving = async () => {
    if (!givingPersonId || savingGiving) return;
    setSavingGiving(true);
    try {
      await addGiving({
        giftIdeaId: ideaId,
        personId: givingPersonId,
        givenAt: givingDate.getTime(),
        occasionId: givingOccasionId ?? undefined,
      });
      closeGivingSheet();
    } catch (err) {
      notify(t("common.couldNotSave"), describeMutationError(err, t));
    } finally {
      setSavingGiving(false);
    }
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
        {idea.imageUrl ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: idea.imageUrl }}
              style={styles.hero}
              contentFit="cover"
              transition={120}
            />
          </View>
        ) : null}

        <View style={styles.body}>
          <Text style={styles.title}>{idea.title}</Text>

          <View style={styles.statusRow}>
            <Pill tone={idea.status === "archived" ? "default" : "brass"}>
              {idea.status === "archived"
                ? t("ideaForm.statusArchived")
                : t("ideaForm.statusActive")}
            </Pill>
            {idea.forSelf === true ? (
              <Pill tone="default">{t("ideaView.forSelfBadge")}</Pill>
            ) : null}
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

          <Btn
            tone="primary"
            full
            disabled={!hasPeople}
            onPress={openGivingSheet}
            style={styles.markGivenBtn}
          >
            {t("ideaView.markGiven")}
          </Btn>
          {!hasPeople && (
            <Text style={styles.markGivenHint}>
              {t("ideaView.markGivenNoPeople")}
            </Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={closeGivingSheet}
      >
        <Pressable style={styles.backdrop} onPress={closeGivingSheet}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>
              {t("ideaView.markGivenSheetTitle")}
            </Text>

            <Label style={styles.sheetLabel}>
              {t("ideaForm.givingPerson")}
            </Label>
            <View style={styles.pillRow}>
              {(people ?? []).map((p) => (
                <Pressable
                  key={p._id}
                  onPress={() => onSelectPerson(p._id)}
                  hitSlop={4}
                >
                  <Pill tone={givingPersonId === p._id ? "brass" : "default"}>
                    {p.nickname ?? p.name}
                  </Pill>
                </Pressable>
              ))}
            </View>

            <Label style={styles.sheetLabel}>
              {t("ideaForm.givingDate")}
            </Label>
            <Pressable
              onPress={() => setGivingDateOpen((v) => !v)}
              hitSlop={6}
              style={styles.dateRow}
            >
              <Pill>{dateFormatter.format(givingDate)}</Pill>
            </Pressable>
            {givingDateOpen && (
              <DateTimePicker
                value={givingDate}
                mode="date"
                display="inline"
                themeVariant="dark"
                accentColor={colors.brass}
                onChange={(_, selected) => {
                  if (selected) setGivingDate(selected);
                }}
              />
            )}

            {givingPersonId &&
              occasionsForPerson &&
              occasionsForPerson.length > 0 && (
                <>
                  <Label style={styles.sheetLabel}>
                    {t("ideaForm.givingOccasion")}
                  </Label>
                  <View style={styles.pillRow}>
                    <Pressable
                      onPress={() => setGivingOccasionId(null)}
                      hitSlop={4}
                    >
                      <Pill
                        tone={givingOccasionId === null ? "brass" : "default"}
                      >
                        {t("ideaForm.givingNoOccasion")}
                      </Pill>
                    </Pressable>
                    {occasionsForPerson.map((o) => (
                      <Pressable
                        key={o._id}
                        onPress={() => setGivingOccasionId(o._id)}
                        hitSlop={4}
                      >
                        <Pill
                          tone={
                            givingOccasionId === o._id ? "brass" : "default"
                          }
                        >
                          {o.title}
                        </Pill>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

            <View style={styles.sheetActions}>
              <Btn
                tone="primary"
                full
                disabled={!givingPersonId || savingGiving}
                onPress={onSaveGiving}
              >
                {savingGiving
                  ? t("common.saving")
                  : t("ideaForm.saveGiving")}
              </Btn>
              <Btn
                tone="default"
                full
                onPress={closeGivingSheet}
                style={styles.sheetCancelBtn}
              >
                {t("common.cancel")}
              </Btn>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexWrap: "wrap",
    gap: spacing.sm,
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
  markGivenBtn: {
    marginTop: spacing.md,
  },
  markGivenHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,26,22,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sheetLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
  },
  sheetActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sheetCancelBtn: {
    marginTop: spacing.xs,
  },
});

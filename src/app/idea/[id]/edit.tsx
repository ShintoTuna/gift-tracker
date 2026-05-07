import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  Avatar,
  Btn,
  Card,
  ImagePickerField,
  KeyboardForm,
  Label,
  NavBar,
  PeoplePicker,
  Pill,
  ScreenTitle,
  TextField,
} from "@/components";
import DateTimePicker from "@/components/internal/DateTimePicker";
import { confirmDestructive, notify } from "@/lib/alerts";
import { describeMutationError } from "@/lib/convexErrors";
import { pickCompressUpload, type PickSource } from "@/lib/imageUpload";
import { useDefaultCurrency } from "@/lib/settings";
import { colors, fonts, spacing } from "@/theme/tokens";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type IdeaStatus = "active" | "archived";
const STATUSES: IdeaStatus[] = ["active", "archived"];
const STATUS_KEY: Record<IdeaStatus, "ideaForm.statusActive" | "ideaForm.statusArchived"> = {
  active: "ideaForm.statusActive",
  archived: "ideaForm.statusArchived",
};

// Same tri-state shape as the person edit form. See the comment in
// src/app/people/[id]/edit.tsx for the rationale.
type ImageState =
  | { kind: "unchanged" }
  | { kind: "set"; storageId: Id<"_storage">; previewUri: string }
  | { kind: "removed" };

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Modal-presented edit screen for a single gift idea. Mirrors the
// Capture form (Idea / Source / Price / People / Description) plus
// an Active/Archived status toggle, a Givings history section, and a
// Delete affordance. Save runs the update mutation; Delete runs
// remove (with an Alert confirmation).
export default function EditIdeaScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ideaId = id as Id<"giftIdeas">;
  const idea = useQuery(api.giftIdeas.getById, { id: ideaId });
  const people = useQuery(api.people.list);
  const givings = useQuery(api.giftGivings.listByIdea, {
    giftIdeaId: ideaId,
  });
  const updateIdea = useMutation(api.giftIdeas.update);
  const removeIdea = useMutation(api.giftIdeas.remove);
  const addGiving = useMutation(api.giftGivings.addGiving);
  const removeGiving = useMutation(api.giftGivings.removeGiving);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const fetchImageFromUrl = useAction(api.imageFromUrl.fetchFromUrl);
  const defaultCurrency = useDefaultCurrency();

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [taggedIds, setTaggedIds] = useState<Id<"people">[]>([]);
  const [status, setStatus] = useState<IdeaStatus>("active");
  const [forSelf, setForSelf] = useState(false);
  const [image, setImage] = useState<ImageState>({ kind: "unchanged" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add-giving inline form state.
  const [addingGiving, setAddingGiving] = useState(false);
  const [givingPersonId, setGivingPersonId] =
    useState<Id<"people"> | null>(null);
  const [givingDate, setGivingDate] = useState<Date>(new Date());
  const [givingOccasionId, setGivingOccasionId] =
    useState<Id<"occasions"> | null>(null);
  const [givingDateOpen, setGivingDateOpen] = useState(false);
  const [savingGiving, setSavingGiving] = useState(false);

  // Initialize form once the idea loads. Re-init only when the route
  // id changes — not when the idea row itself updates, which would
  // clobber in-progress edits if a reactive subscription refreshed.
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setSourceUrl(idea.sourceUrl ?? "");
      setPriceText(
        idea.priceEstimate != null ? String(idea.priceEstimate) : "",
      );
      setDescription(idea.description ?? "");
      setTaggedIds(idea.taggedPeople);
      setStatus(idea.status);
      setForSelf(idea.forSelf === true);
      setImage({ kind: "unchanged" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?._id]);

  const occasionsForPerson = useQuery(
    api.occasions.listByPerson,
    givingPersonId ? { personId: givingPersonId } : "skip",
  );

  const onPickImage = async (source: PickSource) => {
    if (uploading) return;
    setUploading(true);
    try {
      const result = await pickCompressUpload({
        generateUploadUrl: () => generateUploadUrl({}),
        source,
      });
      if (result) {
        setImage({
          kind: "set",
          storageId: result.storageId,
          previewUri: result.previewUri,
        });
      }
    } catch (err) {
      notify(
        t("imagePicker.uploadFailed"),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setUploading(false);
    }
  };

  const onRemoveImage = () => {
    setImage({ kind: "removed" });
  };

  const onFetchImageFromSource = async () => {
    const url = sourceUrl.trim();
    if (!url || uploading) return;
    setUploading(true);
    try {
      const result = await fetchImageFromUrl({ url });
      setImage({
        kind: "set",
        storageId: result.storageId,
        previewUri: result.previewUrl ?? "",
      });
    } catch (err) {
      // Surface a friendly hint instead of the raw Convex error —
      // many retailers block scrapers outright (Amazon, Cloudflare-
      // fronted shops) and "Source returned 403" means nothing to
      // the user. Still log the technical reason for debugging.
      console.warn("fetchImageFromUrl failed", err);
      notify(
        t("imagePicker.fetchFromSourceFailed"),
        t("imagePicker.fetchFromSourceHint"),
      );
    } finally {
      setUploading(false);
    }
  };

  if (idea === undefined) {
    return (
      <View style={styles.root}>
        <NavBar
          title={t("ideaForm.editTitle")}
          leading="close"
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
          title={t("ideaForm.editTitle")}
          leading="close"
          onLeadingPress={() => router.back()}
        />
        <Text style={styles.loadingText}>{t("ideaForm.notFound")}</Text>
      </View>
    );
  }

  const canSave = title.trim().length > 0 && !saving && !uploading;
  const hasImage =
    image.kind === "set" ||
    (image.kind === "unchanged" && !!idea.imageUrl);
  const showFetchFromSource =
    sourceUrl.trim().length > 0 && !uploading && !hasImage;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const parsedPrice = priceText.trim().length
        ? Number.parseFloat(priceText.replace(",", "."))
        : undefined;
      const priceEstimate =
        parsedPrice != null && Number.isFinite(parsedPrice)
          ? parsedPrice
          : undefined;
      await updateIdea({
        id: ideaId,
        patch: {
          title: title.trim(),
          description: description.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          priceEstimate,
          currency:
            priceEstimate !== undefined ? defaultCurrency : undefined,
          taggedPeople: taggedIds,
          status,
          forSelf,
          ...(image.kind === "set" && { imageStorageId: image.storageId }),
          ...(image.kind === "removed" && { imageStorageId: null }),
        },
      });
      router.back();
    } catch (err) {
      notify(t("common.couldNotSave"), describeMutationError(err, t));
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const confirmed = await confirmDestructive({
      title: t("ideaForm.deleteConfirmTitle"),
      message: t("common.cantBeUndone"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
    });
    if (!confirmed) return;
    try {
      await removeIdea({ id: ideaId });
      // Dismiss this modal, then replace the underlying view screen
      // so we don't briefly render the deleted idea on the way back
      // to the list. Wish-only items send the user back to the Wish
      // List tab; everything else lands on Gifts.
      const wishOnly = forSelf && taggedIds.length === 0;
      router.dismissAll();
      router.replace(wishOnly ? "/(tabs)/wishlist" : "/(tabs)/backlog");
    } catch (err) {
      notify(
        t("common.couldNotDelete"),
        err instanceof Error ? err.message : String(err),
      );
    }
  };

  const startAddGiving = () => {
    setGivingPersonId(taggedIds[0] ?? null);
    setGivingDate(new Date());
    setGivingOccasionId(null);
    setGivingDateOpen(false);
    setAddingGiving(true);
  };

  const cancelAddGiving = () => {
    setAddingGiving(false);
    setGivingDateOpen(false);
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
      cancelAddGiving();
    } catch (err) {
      notify(t("common.couldNotSave"), describeMutationError(err, t));
    } finally {
      setSavingGiving(false);
    }
  };

  const onRemoveGiving = async (givingId: Id<"giftGivings">, label: string) => {
    const confirmed = await confirmDestructive({
      title: t("ideaForm.removeGivingConfirm"),
      message: label,
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
    });
    if (!confirmed) return;
    try {
      await removeGiving({ id: givingId });
    } catch (err) {
      notify(
        t("common.couldNotDelete"),
        err instanceof Error ? err.message : String(err),
      );
    }
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("ideaForm.editTitle")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <KeyboardForm>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle>{t("ideaForm.editScreenTitle")}</ScreenTitle>

          <View style={styles.fields}>
            <View>
              <ImagePickerField
                label={t("capture.imageLabel")}
                previewUri={
                  image.kind === "set"
                    ? image.previewUri
                    : image.kind === "removed"
                      ? null
                      : idea.imageUrl
                }
                shape="square"
                uploading={uploading}
                onPick={onPickImage}
                onRemove={onRemoveImage}
              />
              {showFetchFromSource && (
                <Pressable
                  onPress={onFetchImageFromSource}
                  hitSlop={6}
                  style={styles.fetchFromSource}
                >
                  <Text style={styles.fetchFromSourceText}>
                    {t("imagePicker.fetchFromSource")}
                  </Text>
                </Pressable>
              )}
            </View>
            <TextField
              label={t("capture.ideaLabel")}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="next"
            />

            <TextField
              label={t("capture.sourceLabel")}
              placeholder="https://…"
              value={sourceUrl}
              onChangeText={setSourceUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextField
              label={t("capture.priceLabel", { currency: defaultCurrency })}
              placeholder={t("common.optional")}
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />

            <PeoplePicker
              people={people ?? []}
              selectedIds={taggedIds}
              onChange={setTaggedIds}
            />

            <Pressable
              onPress={() => setForSelf((v) => !v)}
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: forSelf }}
              accessibilityLabel={t("ideaForm.forSelfLabel")}
              style={styles.forSelfRow}
            >
              <View style={styles.forSelfTextWrap}>
                <Label>{t("ideaForm.forSelfLabel")}</Label>
                <Text style={styles.forSelfHint}>
                  {t("ideaForm.forSelfHint")}
                </Text>
              </View>
              {/* pointerEvents: row's Pressable owns the tap so the
                  whole row is a hit target; Switch is a visual
                  indicator only. */}
              <View pointerEvents="none">
                <Switch
                  value={forSelf}
                  trackColor={{ false: colors.border, true: colors.brass }}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </Pressable>

            <View>
              <Label style={styles.statusLabel}>{t("ideaForm.status")}</Label>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    hitSlop={4}
                  >
                    <Pill tone={status === s ? "brass" : "default"}>
                      {t(STATUS_KEY[s])}
                    </Pill>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextField
              label={t("capture.descriptionLabel")}
              placeholder={t("common.optional")}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="default"
            />

            <View style={styles.givingsSection}>
              <View style={styles.givingsHeader}>
                <Label>{t("ideaForm.givingsTitle")}</Label>
                {!addingGiving && (people?.length ?? 0) > 0 && (
                  <Pressable onPress={startAddGiving} hitSlop={6}>
                    <Pill tone="brass" dashed>
                      {t("ideaForm.addGiving")}
                    </Pill>
                  </Pressable>
                )}
              </View>

              {givings && givings.length > 0 ? (
                <Card padding={0}>
                  {givings.map((g, idx) => {
                    const dateText = dateFormatter.format(new Date(g.givenAt));
                    const personLabel =
                      g.personNickname ?? g.personName ?? "—";
                    const summary = g.occasionTitle
                      ? `${personLabel} · ${dateText} · ${g.occasionTitle}`
                      : `${personLabel} · ${dateText}`;
                    return (
                      <View
                        key={g._id}
                        style={[
                          styles.givingRow,
                          idx < givings.length - 1 &&
                            styles.givingRowDivider,
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
                          <Text
                            style={styles.givingPrimary}
                            numberOfLines={1}
                          >
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
                        <Pressable
                          onPress={() => onRemoveGiving(g._id, summary)}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel={t("ideaForm.removeGiving")}
                        >
                          <Text style={styles.givingRemove}>×</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </Card>
              ) : (
                !addingGiving && (
                  <Text style={styles.givingsEmpty}>
                    {t("ideaForm.givingsEmpty")}
                  </Text>
                )
              )}

              {addingGiving && (
                <Card>
                  <Label style={styles.givingFormLabel}>
                    {t("ideaForm.givingPerson")}
                  </Label>
                  {(people?.length ?? 0) === 0 ? (
                    <Text style={styles.givingsEmpty}>
                      {t("personPicker.noPeople")}
                    </Text>
                  ) : (
                    <View style={styles.givingPeopleRow}>
                      {people?.map((p) => (
                        <Pressable
                          key={p._id}
                          onPress={() => {
                            setGivingPersonId(p._id);
                            setGivingOccasionId(null);
                          }}
                          hitSlop={4}
                        >
                          <Pill
                            tone={
                              givingPersonId === p._id ? "brass" : "default"
                            }
                          >
                            {p.nickname ?? p.name}
                          </Pill>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Label style={styles.givingFormLabel}>
                    {t("ideaForm.givingDate")}
                  </Label>
                  <Pressable
                    onPress={() => setGivingDateOpen((v) => !v)}
                    hitSlop={6}
                    style={styles.givingDateRow}
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
                        <Label style={styles.givingFormLabel}>
                          {t("ideaForm.givingOccasion")}
                        </Label>
                        <View style={styles.givingPeopleRow}>
                          <Pressable
                            onPress={() => setGivingOccasionId(null)}
                            hitSlop={4}
                          >
                            <Pill
                              tone={
                                givingOccasionId === null ? "brass" : "default"
                              }
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
                                  givingOccasionId === o._id
                                    ? "brass"
                                    : "default"
                                }
                              >
                                {o.title}
                              </Pill>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    )}

                  <View style={styles.givingFormActions}>
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
                      onPress={cancelAddGiving}
                      style={styles.givingCancelBtn}
                    >
                      {t("common.cancel")}
                    </Btn>
                  </View>
                </Card>
              )}
            </View>

            <Btn
              tone="primary"
              full
              disabled={!canSave}
              onPress={onSave}
              style={styles.saveBtn}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Btn>

            <Btn
              tone="danger"
              full
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              {t("ideaForm.deleteButton")}
            </Btn>
          </View>
        </ScrollView>
      </KeyboardForm>
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
  fields: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  statusLabel: {
    marginBottom: spacing.sm,
  },
  forSelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  forSelfTextWrap: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  forSelfHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text3,
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  givingsSection: {
    gap: spacing.md,
  },
  givingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  givingsEmpty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    paddingTop: spacing.xs,
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
  givingRemove: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: colors.text3,
    paddingHorizontal: spacing.sm,
  },
  givingFormLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  givingPeopleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  givingDateRow: {
    flexDirection: "row",
  },
  givingFormActions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  givingCancelBtn: {
    marginTop: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.md,
  },
  deleteBtn: {
    marginTop: spacing.sm,
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
  fetchFromSource: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fetchFromSourceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.brass,
  },
});

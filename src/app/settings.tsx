import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import * as Application from "expo-application";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Btn, Card, Label, NavBar, Pill, ScreenTitle } from "@/components";
import DateTimePicker from "@/components/internal/DateTimePicker";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/i18n";
import {
  DEFAULT_CURRENCY,
  DEFAULT_REMINDER_DAYS_AHEAD,
  DEFAULT_REMINDER_TIME_OF_DAY_MINUTES,
  useErrorReportsEnabled,
  useNotificationPrefs,
  usePreferredLanguage,
} from "@/lib/settings";
import {
  getDeviceTimezone,
  getStoredPushToken,
  requestPermissionsAndGetToken,
} from "@/lib/notifications";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

import { api } from "../../convex/_generated/api";

// External URLs for the About section. Swap to the production domain
// once the marketing site lands; the in-app links are the only thing
// that needs updating.
const PRIVACY_POLICY_URL = "https://giftsmith.app/privacy";
const TERMS_OF_SERVICE_URL = "https://giftsmith.app/terms";
const FEEDBACK_EMAIL = "nikita.shatunov@gmail.com";

const MAX_DAYS_AHEAD_ENTRIES = 10;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 365;

const CURRENCIES: { code: string; label: string }[] = [
  { code: "EUR", label: "EUR €" },
  { code: "USD", label: "USD $" },
  { code: "GBP", label: "GBP £" },
  { code: "JPY", label: "JPY ¥" },
];

// Modal-presented Settings screen. Sections (top-to-bottom):
// Preferences (currency, language) → Notifications → Account
// (email, usage, sign out, delete) → About (version, privacy /
// terms links, feedback, error-reports toggle).
export default function SettingsScreen() {
  const { t } = useTranslation();
  const settings = useQuery(api.userSettings.get);
  const me = useQuery(api.users.me);
  const usage = useQuery(api.users.getUsage);
  const setDefaultCurrency = useMutation(api.userSettings.setDefaultCurrency);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const unregisterToken = useMutation(api.notifications.unregisterToken);
  const { signOut } = useAuthActions();
  const { language: currentLanguage, setLanguage } = usePreferredLanguage();
  const { prefs: notificationPrefs, setPrefs: setNotificationPrefs } =
    useNotificationPrefs();

  const currentCurrency = settings?.defaultCurrency ?? DEFAULT_CURRENCY;

  const onSignOut = () => {
    Alert.alert(
      t("auth.account.signOutConfirm"),
      undefined,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.account.signOut"),
          style: "destructive",
          onPress: async () => {
            // Best-effort token cleanup before the auth context
            // disappears. Silenced — the cron also prunes via Expo's
            // DeviceNotRegistered receipt if this fails.
            try {
              const token = await getStoredPushToken();
              if (token) await unregisterToken({ token });
            } catch {
              // ignore
            }
            await signOut();
          },
        },
      ],
    );
  };

  const onDeleteAccount = () => {
    Alert.alert(
      t("auth.account.deleteConfirmTitle"),
      t("auth.account.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.account.deleteConfirmCta"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount({});
              await signOut();
            } catch (err) {
              Alert.alert(
                t("auth.errorTitle"),
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <NavBar
        title={t("settings.title")}
        leading="close"
        onLeadingPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle sub={t("settings.subtitle")}>
          {t("settings.title")}
        </ScreenTitle>

        <View style={styles.section}>
          <Label style={styles.sectionLabel}>{t("settings.preferences")}</Label>
          <Card>
            <Text style={styles.fieldLabel}>{t("settings.defaultCurrency")}</Text>
            <Text style={styles.fieldHint}>
              {t("settings.defaultCurrencyHint")}
            </Text>
            <View style={styles.choiceRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    if (c.code !== currentCurrency) {
                      setDefaultCurrency({ currency: c.code });
                    }
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={c.label}
                  accessibilityState={{ selected: c.code === currentCurrency }}
                >
                  <Pill tone={c.code === currentCurrency ? "brass" : "default"}>
                    {c.label}
                  </Pill>
                </Pressable>
              ))}
            </View>
          </Card>

          <View style={styles.cardSpacer} />

          <Card>
            <Text style={styles.fieldLabel}>{t("settings.language")}</Text>
            <Text style={styles.fieldHint}>{t("settings.languageHint")}</Text>
            <View style={styles.choiceRow}>
              {SUPPORTED_LANGUAGES.map((code: Language) => (
                <Pressable
                  key={code}
                  onPress={() => {
                    if (code !== currentLanguage) {
                      void setLanguage(code);
                    }
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={LANGUAGE_LABELS[code]}
                  accessibilityState={{ selected: code === currentLanguage }}
                >
                  <Pill tone={code === currentLanguage ? "brass" : "default"}>
                    {LANGUAGE_LABELS[code]}
                  </Pill>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>

        {Platform.OS !== "web" && (
          <NotificationsSection
            prefs={notificationPrefs}
            setPrefs={setNotificationPrefs}
          />
        )}

        <View style={styles.section}>
          <Label style={styles.sectionLabel}>{t("auth.account.title")}</Label>
          <Card>
            {me?.email ? (
              <Text style={styles.emailText} numberOfLines={1}>
                {me.email}
              </Text>
            ) : null}
            {me?.linkedProviders && me.linkedProviders.length > 0 ? (
              <View style={styles.linkedBlock}>
                <Text style={styles.fieldLabel}>
                  {t("auth.account.linkedLabel")}{" "}
                  <Text style={styles.linkedValue}>
                    {me.linkedProviders
                      .map((p) =>
                        t(`auth.account.linked${p.charAt(0).toUpperCase()}${p.slice(1)}`, {
                          defaultValue: p,
                        }),
                      )
                      .join(", ")}
                  </Text>
                </Text>
                <Text style={styles.fieldHint}>{t("auth.account.linkedHint")}</Text>
              </View>
            ) : null}
            {usage ? (
              <View style={styles.usageBlock}>
                <Text style={styles.usageRow}>
                  {t("auth.account.usagePeople", {
                    used: usage.people.current,
                    total: usage.people.limit,
                  })}
                </Text>
                <Text style={styles.usageRow}>
                  {t("auth.account.usageGiftIdeas", {
                    used: usage.giftIdeas.current,
                    total: usage.giftIdeas.limit,
                  })}
                </Text>
              </View>
            ) : null}
            <View style={styles.accountActions}>
              <Btn tone="default" full onPress={onSignOut}>
                {t("auth.account.signOut")}
              </Btn>
              <Btn tone="danger" full onPress={onDeleteAccount}>
                {t("auth.account.delete")}
              </Btn>
            </View>
          </Card>
        </View>

        <AboutSection />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// About section. App version + external links (privacy/terms,
// feedback) + crash-reporting opt-out toggle.
// ---------------------------------------------------------------------------

function AboutSection() {
  const { t } = useTranslation();
  const { enabled: errorReportsEnabled, setEnabled: setErrorReportsEnabled } =
    useErrorReportsEnabled();

  // The semver `version` from app.json is the user-facing release
  // number we bump per release. The native build number
  // (CFBundleVersion / versionCode) is auto-incremented by EAS and
  // isn't useful for end users, so it stays out of the UI — App
  // Store Connect, EAS, and Sentry release names already carry it.
  const versionLabel = Application.nativeApplicationVersion ?? "—";

  // Surface which JS bundle is actually running. `isEmbeddedLaunch`
  // is true when we're on the bundle that shipped inside the binary
  // (no OTA applied yet, or OTA disabled in dev). When false, an EAS
  // Update has been delivered and we show its short id so the
  // installer can verify a fresh OTA actually landed instead of
  // guessing from the native version alone.
  const updateLabel =
    Updates.isEmbeddedLaunch || !Updates.updateId
      ? t("settings.about.updateEmbedded")
      : Updates.updateId.slice(0, 8);

  const openExternal = (url: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(t("settings.about.openFailed"));
    });
  };

  const onSendFeedback = () => {
    const subject = encodeURIComponent(t("settings.about.feedbackSubject"));
    openExternal(`mailto:${FEEDBACK_EMAIL}?subject=${subject}`);
  };

  return (
    <View style={styles.section}>
      <Label style={styles.sectionLabel}>{t("settings.about.title")}</Label>

      <Card>
        <View style={styles.aboutRow}>
          <Text style={styles.fieldLabel}>{t("settings.about.version")}</Text>
          <Text style={styles.aboutValue}>{versionLabel}</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.fieldLabel}>{t("settings.about.update")}</Text>
          <Text style={styles.aboutValue}>{updateLabel}</Text>
        </View>
      </Card>

      <View style={styles.cardSpacer} />

      <Card padding={0}>
        <AboutLinkRow
          label={t("settings.about.privacy")}
          onPress={() => openExternal(PRIVACY_POLICY_URL)}
          showDivider
        />
        <AboutLinkRow
          label={t("settings.about.terms")}
          onPress={() => openExternal(TERMS_OF_SERVICE_URL)}
          showDivider
        />
        <AboutLinkRow
          label={t("settings.about.feedback")}
          onPress={onSendFeedback}
        />
      </Card>

      <View style={styles.cardSpacer} />

      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.fieldLabel}>
              {t("settings.about.errorReports")}
            </Text>
            <Text style={styles.fieldHint}>
              {t("settings.about.errorReportsHint")}
            </Text>
          </View>
          <Switch
            value={errorReportsEnabled}
            onValueChange={(next) => {
              void setErrorReportsEnabled(next);
            }}
            trackColor={{ true: colors.brass, false: colors.surface2 }}
            thumbColor={colors.bg}
          />
        </View>
      </Card>
    </View>
  );
}

function AboutLinkRow({
  label,
  onPress,
  showDivider = false,
}: {
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.aboutLinkRow,
        showDivider && styles.aboutLinkRowDivider,
        pressed && styles.aboutLinkRowPressed,
      ]}
    >
      <Text style={styles.aboutLinkLabel}>{label}</Text>
      <Text style={styles.aboutLinkChevron}>›</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Notifications section (Step 18). Three cards:
//   1. Master toggle + iOS permission flow on flip-on.
//   2. Days-ahead manual entry — chips + numeric input + Add.
//   3. Time-of-day picker (`@react-native-community/datetimepicker`).
// ---------------------------------------------------------------------------

type NotificationPrefsShape = ReturnType<typeof useNotificationPrefs>["prefs"];
type SetNotificationPrefs = ReturnType<typeof useNotificationPrefs>["setPrefs"];

function NotificationsSection({
  prefs,
  setPrefs,
}: {
  prefs: NotificationPrefsShape;
  setPrefs: SetNotificationPrefs;
}) {
  const { t } = useTranslation();
  const enabled = prefs?.enabled === true;

  const onToggle = async (next: boolean) => {
    if (next) {
      const token = await requestPermissionsAndGetToken();
      if (!token) {
        Alert.alert(t("settings.notifications.permissionDenied"));
        return;
      }
      await setPrefs({
        enabled: true,
        timezone: getDeviceTimezone(),
        // Seed defaults only on first opt-in so the user has something
        // to see immediately. They overwrite freely.
        daysAhead:
          prefs?.daysAhead && prefs.daysAhead.length > 0
            ? prefs.daysAhead
            : DEFAULT_REMINDER_DAYS_AHEAD,
        timeOfDayMinutes:
          prefs?.timeOfDayMinutes ?? DEFAULT_REMINDER_TIME_OF_DAY_MINUTES,
      });
    } else {
      await setPrefs({ enabled: false });
    }
  };

  return (
    <View style={styles.section}>
      <Label style={styles.sectionLabel}>
        {t("settings.notifications.title")}
      </Label>

      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.fieldLabel}>
              {t("settings.notifications.masterToggle")}
            </Text>
            <Text style={styles.fieldHint}>
              {t("settings.notifications.hint")}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(next) => {
              void onToggle(next);
            }}
            trackColor={{ true: colors.brass, false: colors.surface2 }}
            thumbColor={colors.bg}
          />
        </View>
      </Card>

      <View style={styles.cardSpacer} />

      <DaysAheadCard
        prefs={prefs}
        setPrefs={setPrefs}
        disabled={!enabled}
      />

      <View style={styles.cardSpacer} />

      <TimeOfDayCard
        prefs={prefs}
        setPrefs={setPrefs}
        disabled={!enabled}
      />
    </View>
  );
}

function DaysAheadCard({
  prefs,
  setPrefs,
  disabled,
}: {
  prefs: NotificationPrefsShape;
  setPrefs: SetNotificationPrefs;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const days = prefs?.daysAhead ?? [];

  const onAdd = async () => {
    const parsed = Number.parseInt(draft, 10);
    if (
      !Number.isInteger(parsed) ||
      String(parsed) !== draft.trim() ||
      parsed < MIN_DAYS_AHEAD ||
      parsed > MAX_DAYS_AHEAD
    ) {
      setError(t("settings.notifications.daysAheadInvalid"));
      return;
    }
    if (days.includes(parsed)) {
      setError(t("settings.notifications.daysAheadDuplicate"));
      return;
    }
    if (days.length >= MAX_DAYS_AHEAD_ENTRIES) {
      setError(t("settings.notifications.daysAheadMax"));
      return;
    }
    const next = [...days, parsed].sort((a, b) => a - b);
    setError(null);
    setDraft("");
    await setPrefs({ daysAhead: next });
  };

  const onRemove = async (value: number) => {
    const next = days.filter((d) => d !== value);
    await setPrefs({ daysAhead: next });
  };

  return (
    <Card style={disabled ? styles.cardDisabled : undefined}>
      <Text style={styles.fieldLabel}>
        {t("settings.notifications.daysAhead")}
      </Text>
      <Text style={styles.fieldHint}>
        {t("settings.notifications.daysAheadHint")}
      </Text>

      {days.length > 0 ? (
        <View style={styles.choiceRow}>
          {days.map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                if (!disabled) void onRemove(d);
              }}
              hitSlop={4}
              accessibilityLabel={t(
                "settings.notifications.daysAheadRemoveA11y",
                { count: d },
              )}
            >
              <Pill tone="brass">
                {t("settings.notifications.daysAheadPill", { count: d })} ✕
              </Pill>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.inlineInputRow}>
        <TextInput
          value={draft}
          onChangeText={(next) => {
            setDraft(next);
            if (error) setError(null);
          }}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={3}
          placeholder={t("settings.notifications.daysAheadInputPlaceholder")}
          placeholderTextColor={colors.text3}
          selectionColor={colors.brass}
          style={styles.inlineInput}
        />
        <Btn
          tone="default"
          disabled={disabled || draft.trim().length === 0}
          onPress={() => {
            void onAdd();
          }}
        >
          {t("settings.notifications.daysAheadAdd")}
        </Btn>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Card>
  );
}

function TimeOfDayCard({
  prefs,
  setPrefs,
  disabled,
}: {
  prefs: NotificationPrefsShape;
  setPrefs: SetNotificationPrefs;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const minutes =
    prefs?.timeOfDayMinutes ?? DEFAULT_REMINDER_TIME_OF_DAY_MINUTES;
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return (
    <Card style={disabled ? styles.cardDisabled : undefined}>
      <Text style={styles.fieldLabel}>
        {t("settings.notifications.timeOfDay")}
      </Text>
      <Text style={styles.fieldHint}>
        {t("settings.notifications.timeOfDayHint")}
      </Text>
      <View style={styles.timePickerRow}>
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          themeVariant="dark"
          accentColor={colors.brass}
          disabled={disabled}
          onChange={(_, selected) => {
            if (!selected || disabled) return;
            const next = selected.getHours() * 60 + selected.getMinutes();
            void setPrefs({ timeOfDayMinutes: next });
          }}
        />
      </View>
    </Card>
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
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  fieldHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
    lineHeight: 18,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardSpacer: {
    height: spacing.md,
  },
  emailText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  linkedBlock: {
    marginBottom: spacing.md,
  },
  linkedValue: {
    fontFamily: fonts.bodySemiBold,
    color: colors.brass,
  },
  usageBlock: {
    gap: 4,
    marginBottom: spacing.md,
  },
  usageRow: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text3,
  },
  accountActions: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.claret,
    marginTop: spacing.sm,
  },
  timePickerRow: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
  },
  aboutLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  aboutLinkRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutLinkRowPressed: {
    opacity: 0.6,
  },
  aboutLinkLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  aboutLinkChevron: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: colors.text3,
    marginLeft: spacing.sm,
  },
});

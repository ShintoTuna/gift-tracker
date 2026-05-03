import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { TextField } from "@/components/TextField";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Email-OTP login screen. Two-step state machine:
//
//   step "email" → user types address → signIn("resend-otp", { email })
//                  → backend sends 8-digit code via Resend
//   step "code"  → user types code → signIn("resend-otp", { email, code })
//                  → AuthGate flips on success (root _layout handles redirect)
//
// Convex Auth handles signup-vs-signin uniformly: a fresh email
// creates a new user via createOrUpdateUser, a returning email
// reuses the existing row. No separate sign-up flow needed.
type Step = "email" | "code";

export default function EmailLoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  const handleSendCode = async () => {
    if (pending) return;
    const trimmed = email.trim().toLowerCase();
    // Minimal client-side gate; server validates rigorously.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert(t("auth.errorTitle"), t("auth.email.errors.invalidEmail"));
      return;
    }
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("email", trimmed);
      await signIn("resend-otp", formData);
      setEmail(trimmed);
      setStep("code");
      // Focus the code input after the transition. RN re-mounts on
      // step change so the ref is fresh; defer one tick.
      setTimeout(() => codeInputRef.current?.focus(), 50);
    } catch {
      Alert.alert(t("auth.errorTitle"), t("auth.email.errors.sendFailed"));
    } finally {
      setPending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (pending) return;
    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      Alert.alert(t("auth.errorTitle"), t("auth.email.errors.invalidCode"));
      return;
    }
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", trimmedCode);
      await signIn("resend-otp", formData);
      // AuthGate in src/app/_layout.tsx flips on isAuthenticated and
      // redirects to /welcome (new user) or / (returning).
    } catch {
      Alert.alert(t("auth.errorTitle"), t("auth.email.errors.invalidCode"));
      setPending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    if (pending) return;
    setCode("");
    setStep("email");
  };

  const handleResendCode = async () => {
    if (pending) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      await signIn("resend-otp", formData);
    } catch {
      Alert.alert(t("auth.errorTitle"), t("auth.email.errors.sendFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Image
            source={require("../../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t("auth.email.title")}</Text>
          <Text style={styles.subtitle}>
            {step === "email"
              ? t("auth.email.subtitle")
              : t("auth.email.codeSentTo", { email })}
          </Text>
        </View>

        <View style={styles.form}>
          {step === "email" ? (
            <>
              <TextField
                label={t("auth.email.emailLabel")}
                placeholder={t("auth.email.emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
                editable={!pending}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("auth.email.sendCodeCta")}
                onPress={handleSendCode}
                disabled={pending}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryPressed,
                  pending && styles.primaryDisabled,
                ]}
              >
                {pending ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.primaryText}>
                    {t("auth.email.sendCodeCta")}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextField
                ref={codeInputRef}
                label={t("auth.email.codeLabel")}
                placeholder={t("auth.email.codePlaceholder")}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={8}
                returnKeyType="go"
                onSubmitEditing={handleVerifyCode}
                editable={!pending}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("auth.email.signInCta")}
                onPress={handleVerifyCode}
                disabled={pending}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryPressed,
                  pending && styles.primaryDisabled,
                ]}
              >
                {pending ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.primaryText}>
                    {t("auth.email.signInCta")}
                  </Text>
                )}
              </Pressable>
              <View style={styles.linkRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleResendCode}
                  disabled={pending}
                  hitSlop={8}
                >
                  <Text style={styles.linkText}>
                    {t("auth.email.resendCode")}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleUseDifferentEmail}
                  disabled={pending}
                  hitSlop={8}
                >
                  <Text style={styles.linkText}>
                    {t("auth.email.useDifferentEmail")}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          // replace (not back) — login.tsx replaced itself with this
          // screen, so there's nothing to pop. Replace mirrors that.
          onPress={() => router.replace("/(auth)/login")}
          disabled={pending}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Text style={styles.backText}>{t("common.back")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text3,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  form: {
    gap: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.brass,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPressed: {
    backgroundColor: colors.brassDim,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: colors.bg,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  linkText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.brass,
  },
  backBtn: {
    marginTop: spacing.xl,
    alignSelf: "center",
    padding: spacing.sm,
  },
  backText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text3,
  },
});

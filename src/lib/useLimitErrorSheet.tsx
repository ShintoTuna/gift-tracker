import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { LimitReachedSheet } from "@/components/LimitReachedSheet";
import {
  describeMutationError,
  getLimitReachedData,
  type LimitReachedData,
} from "@/lib/convexErrors";

// Pairs a `LimitReachedSheet` with the matching error handler. Use
// from any screen that calls a create mutation which can throw
// `LimitReached`. Non-limit errors fall back to the existing Alert
// behavior so callers keep one entry point.
//
//   const { handleError, sheet } = useLimitErrorSheet();
//   ...
//   try { await create({ ... }) }
//   catch (err) { handleError(err, t("common.couldNotSave")) }
//   ...
//   return <View>...{sheet}</View>
export function useLimitErrorSheet() {
  const { t } = useTranslation();
  const [data, setData] = useState<LimitReachedData | null>(null);

  const handleError = useCallback(
    (err: unknown, fallbackTitle: string) => {
      const limit = getLimitReachedData(err);
      if (limit) {
        setData(limit);
        return;
      }
      Alert.alert(fallbackTitle, describeMutationError(err, t));
    },
    [t],
  );

  const sheet = (
    <LimitReachedSheet data={data} onDismiss={() => setData(null)} />
  );

  return { handleError, sheet };
}

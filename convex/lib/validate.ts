import { ConvexError } from "convex/values";

// Per-field caps. Picked to be generous for legitimate use while
// preventing abuse (e.g., a 1MB description string clogging a
// transaction). Numbers are deliberately round so the corresponding
// UI hints can match without a separate constants file.
export const FIELD_LIMITS = {
  personName: 100,
  personNickname: 60,
  personRelationship: 60,
  interest: 60,
  interestsArray: 20,
  giftTitle: 200,
  giftDescription: 2000,
  giftSourceUrl: 2000,
  occasionTitle: 200,
} as const;

// Throws a typed ConvexError so the client can map it back to a user-
// readable message. The `field` payload is what the form-side error
// renderer keys on; never include the user-supplied value (that's a
// PII leak waiting to happen).
function tooLong(field: string, max: number): never {
  throw new ConvexError({
    code: "validation/too-long",
    field,
    max,
  });
}

function badFormat(field: string): never {
  throw new ConvexError({
    code: "validation/bad-format",
    field,
  });
}

export function assertMaxLength(
  field: string,
  value: string | undefined,
  max: number,
): void {
  if (value === undefined) return;
  if (value.length > max) tooLong(field, max);
}

// ISO 4217 currency code: three uppercase ASCII letters. Lowercase
// is rejected — clients normalize before sending.
const CURRENCY_RE = /^[A-Z]{3}$/;

export function assertCurrency(
  field: string,
  value: string | undefined,
): void {
  if (value === undefined) return;
  if (!CURRENCY_RE.test(value)) badFormat(field);
}

export function assertInterests(value: readonly string[] | undefined): void {
  if (value === undefined) return;
  if (value.length > FIELD_LIMITS.interestsArray) {
    tooLong("interests", FIELD_LIMITS.interestsArray);
  }
  for (const interest of value) {
    if (interest.length > FIELD_LIMITS.interest) {
      tooLong("interest", FIELD_LIMITS.interest);
    }
  }
}

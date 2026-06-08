/**
 * Shared live input filters for uncontrolled form fields.
 * ──────────────────────────────────────────────────────
 * Sanitize the DOM value in place on change (also catches pasted text):
 *  - onLettersInput: name-style fields reject digits/symbols, so e.g. Province
 *    can't be "123". \p{L} keeps Unicode letters, so Urdu still types fine.
 *  - onDigitsInput: CC/number-style text fields accept digits only.
 */

const LETTERS_RE = /[^\p{L}\s.'-]/gu;
const DIGITS_RE = /[^0-9]/g;

export const onLettersInput = (e) => {
  const cleaned = e.target.value.replace(LETTERS_RE, "");
  if (cleaned !== e.target.value) e.target.value = cleaned;
};

export const onDigitsInput = (e) => {
  const cleaned = e.target.value.replace(DIGITS_RE, "");
  if (cleaned !== e.target.value) e.target.value = cleaned;
};

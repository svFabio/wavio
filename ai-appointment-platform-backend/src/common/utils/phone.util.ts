/**
 * Normalizes a phone number to E.164 standard format (+<country><national_number>).
 * Removes spaces, dashes, parentheses, and other non-digit characters.
 *
 * @param phone Raw phone number string
 * @param defaultCountry Default country code without plus sign (defaults to '591' for Bolivia)
 * @returns E.164 formatted string (+<digits>)
 */
export function normalizePhoneE164(phone: string, defaultCountry = '591'): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const trimmed = phone.trim();
  const startsWithPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  if (startsWithPlus) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith(defaultCountry)) {
    return `+${digitsOnly}`;
  }

  // Local phone number (typically 7 or 8 digits)
  if (digitsOnly.length <= 8) {
    return `+${defaultCountry}${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

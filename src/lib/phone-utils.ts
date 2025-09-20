// Utilitários para manipulação de telefones australianos

/**
 * Normalizes an Australian phone number to the format +61XXXXXXXXX
 * Only accepts Australian phone numbers (DDI +61)
 */
export function normalizeAustralianPhone(phone: string): string {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different input formats for Australian numbers only
  if (cleanPhone.startsWith('61') && cleanPhone.length === 11) {
    // Already in international format without +
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    // Australian national format (0XXXXXXXXX)
    return `+61${cleanPhone.substring(1)}`;
  } else if (cleanPhone.length === 9) {
    // Local format (XXXXXXXXX)
    return `+61${cleanPhone}`;
  }
  
  // If already has +61, clean and return
  if (phone.startsWith('+61')) {
    return `+61${cleanPhone.substring(2)}`;
  }
  
  // Default: assume it's a local Australian number and add +61
  return `+61${cleanPhone}`;
}

/**
 * Formats an Australian phone number for display (XXX XXX XXX)
 * Only works with Australian numbers
 */
export function formatAustralianPhoneDisplay(phone: string): string {
  const normalized = normalizeAustralianPhone(phone);
  // Remove +61 and format as XXX XXX XXX
  const localNumber = normalized.substring(3);
  
  if (localNumber.length === 9) {
    return `${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
  }
  
  return localNumber;
}

/**
 * Validates if a phone number is a valid Australian phone number
 * Only accepts Australian DDI (+61)
 */
export function isValidAustralianPhone(phone: string): boolean {
  const normalized = normalizeAustralianPhone(phone);
  
  // Must start with +61 and have exactly 12 characters (+61 + 9 digits)
  if (!normalized.startsWith('+61') || normalized.length !== 12) {
    return false;
  }
  
  // Extract the local number (without +61)
  const localNumber = normalized.substring(3);
  
  // Australian mobile numbers start with 4
  // Australian landline numbers start with 2, 3, 7, or 8
  const firstDigit = localNumber[0];
  return ['2', '3', '4', '7', '8'].includes(firstDigit);
}

/**
 * Converts a display format phone back to normalized format
 * Only for Australian numbers
 */
export function parseDisplayPhone(displayPhone: string): string {
  // Remove spaces and add +61
  const cleanPhone = displayPhone.replace(/\s/g, '');
  return normalizeAustralianPhone(cleanPhone);
}

/**
 * Parses phone components for the PhoneInput component
 * Always returns +61 as country code (Australia only)
 */
export function parsePhoneComponents(phone: string): { countryCode: string; phoneNumber: string } {
  if (!phone) {
    return { countryCode: '+61', phoneNumber: '' };
  }
  
  const normalized = normalizeAustralianPhone(phone);
  const localNumber = normalized.substring(3);
  
  return {
    countryCode: '+61',
    phoneNumber: formatAustralianPhoneDisplay(normalized)
  };
}
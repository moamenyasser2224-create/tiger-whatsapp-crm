export const CUSTOMER_SOURCES = [
  'Ads',
  'WhatsApp',
  'Instagram',
  'Facebook',
  'Referral',
  'Exhibition',
  'Other',
] as const;

export type CustomerSource = typeof CUSTOMER_SOURCES[number] | string;

export const CUSTOMER_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Closed Won',
  'Lost',
] as const;

export type CustomerStatus = typeof CUSTOMER_STATUSES[number] | string;

export const DEFAULT_MESSAGE_TEMPLATES: Record<string, string> = {
  'New': 'Hello {name}, thank you for contacting Tiger! How can we assist you today?',
  'Contacted': 'Hello {name}, following up regarding our recent discussion. Let us know if you need any further specifications.',
  'Interested': 'Hello {name}, we are pleased to assist you with our machine automation solutions. Feel free to ask any questions!',
  'Closed Won': 'Hello {name}, thank you for partnering with Tiger! We are dedicated to ensuring your operations run smoothly.',
  'Lost': 'Hello {name}, thank you for your consideration. Feel free to contact us whenever you require industrial automation solutions.',
  // Legacy backward-compatibility mappings
  '\u062C\u062F\u064A\u062F': 'Hello {name}, thank you for contacting Tiger! How can we assist you today?',
  '\u062A\u0645 \u0627\u0644\u062A\u0648\u0627\u0635\u0644': 'Hello {name}, following up regarding our recent discussion. Let us know if you need any further specifications.',
  '\u0645\u0647\u062A\u0645': 'Hello {name}, we are pleased to assist you with our machine automation solutions. Feel free to ask any questions!',
  '\u062A\u0645 \u0627\u0644\u0628\u064A\u0639': 'Hello {name}, thank you for partnering with Tiger! We are dedicated to ensuring your operations run smoothly.',
  '\u063A\u064A\u0631 \u0645\u0647\u062A\u0645': 'Hello {name}, thank you for your consideration. Feel free to contact us whenever you require industrial automation solutions.',
};

// Phone regex: Digits only, 8 to 15 digits (international format without +)
export const PHONE_REGEX = /^[0-9]{8,15}$/;

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const PASSWORD_RESET_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export const CUSTOMER_SOURCES = [
  'إعلان',
  'واتساب',
  'انستغرام',
  'فيسبوك',
  'توصية',
  'معرض',
  'أخرى',
] as const;

export type CustomerSource = typeof CUSTOMER_SOURCES[number];

export const CUSTOMER_STATUSES = [
  'جديد',
  'تم التواصل',
  'مهتم',
  'تم البيع',
  'غير مهتم',
] as const;

export type CustomerStatus = typeof CUSTOMER_STATUSES[number];

export const DEFAULT_MESSAGE_TEMPLATES: Record<CustomerStatus, string> = {
  'جديد': 'مرحباً {name}، شكرًا لتواصلك معنا! كيف يمكننا مساعدتك؟',
  'تم التواصل': 'مرحباً {name}، تم التواصل معك سابقًا، حابب أتابع معاك آخر التفاصيل.',
  'مهتم': 'مرحباً {name}، حابب أطمّن هل لسه مهتم بالعرض؟ جاهز أساعدك بأي استفسار.',
  'تم البيع': 'مرحباً {name}، شكرًا لثقتك بنا! لو احتجت أي دعم بعد الشراء أنا موجود.',
  'غير مهتم': 'مرحباً {name}، تمام، لو احتجت أي حاجة في المستقبل أنا موجود.',
};

// Phone regex: Digits only, 8 to 15 digits (international format without +)
export const PHONE_REGEX = /^[0-9]{8,15}$/;

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const PASSWORD_RESET_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

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

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'employee';
  isTwoFactorEnabled: boolean;
  photoUrl?: string | null;
  mustChangePassword?: boolean;
  hasFaceEnrolled?: boolean;
  faceEnrolledAt?: string | null;
  biometricConsent?: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    photoUrl?: string | null;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role?: string;
    photoUrl?: string | null;
  };
}

export interface ListOption {
  id: string;
  type: 'source' | 'status';
  label: string;
  order: number;
  isDefault: boolean;
}

export interface Settings {
  id: string;
  orgName: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  company: string | null;
  phone: string;
  city: string | null;
  source: string;
  status: string;
  sourceId?: string | null;
  statusId?: string | null;
  sourceOption?: ListOption | null;
  statusOption?: ListOption | null;
  last: string | null;
  next: string | null;
  notes: string | null;
  consent: boolean;
  consentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  status: CustomerStatus;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  conversionRate: number;
  dueTodayCount: number;
  statusDistribution: Record<CustomerStatus, number>;
  sourceDistribution: Record<CustomerSource, number>;
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'department' | 'private';
  departmentId?: string | null;
  createdAt: string;
  _count?: {
    members: number;
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  channelId?: string | null;
  parentId?: string | null;
  text: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role?: string;
    photoUrl?: string | null;
  };
  parent?: {
    id: string;
    text: string;
    sender: { id: string; name: string };
  } | null;
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

export interface CustomerActivity {
  id: string;
  customerId: string;
  userId: string;
  type: 'note' | 'call' | 'whatsapp' | 'meeting' | 'status_change';
  title: string;
  details?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface CustomerTask {
  id: string;
  customerId: string;
  userId: string;
  title: string;
  dueAt: string;
  doneAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
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
  dealValue?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  pipelineStage?: string | null;
  last: string | null;
  next: string | null;
  notes: string | null;
  consent: boolean;
  consentDate: string;
  activities?: CustomerActivity[];
  tasks?: CustomerTask[];
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

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  gracePeriodMinutes: number;
  isDefault: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  };
}

export interface AttendanceCorrection {
  id: string;
  userId: string;
  date: string;
  requestedCheckIn?: string | null;
  requestedCheckOut?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  };
}

export interface HeatmapDay {
  date: string;
  status: 'present' | 'late' | 'absent' | 'leave' | 'holiday' | 'weekend' | 'future';
  lateMinutes?: number;
  workedMinutes?: number;
  hasDeduction?: boolean;
}

export interface Deduction {
  id: string;
  userId: string;
  attendanceId?: string | null;
  period: string; // YYYY-MM
  type: 'late' | 'early_leave' | 'unexcused_absence' | 'unpaid_leave' | 'other';
  reason: string;
  amount: number;
  status: 'proposed' | 'approved' | 'disputed' | 'cancelled' | 'closed_in_payroll';
  calculationDetails?: {
    salary?: number;
    dayWage?: number;
    lateMinutes?: number;
    tier?: string;
    multiplier?: number;
    explanation?: string;
    capApplied?: boolean;
  };
  approvedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  };
  dispute?: DeductionDispute | null;
}

export interface DeductionDispute {
  id: string;
  deductionId: string;
  userId: string;
  reason: string;
  attachmentUrl?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  adminNotes?: string | null;
  createdAt: string;
}

export interface Adjustment {
  id: string;
  userId: string;
  period: string; // YYYY-MM
  type: 'bonus' | 'manual_deduction';
  amount: number;
  reason: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  };
}

export interface PayrollPeriod {
  id: string;
  period: string;
  status: 'open' | 'closed';
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface UserPayrollSummary {
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
  };
  monthlySalary: number;
  dayWage: number;
  totalDeductions: number;
  disciplinaryDeductions: number;
  disciplinaryCapAmount: number;
  capExceeded: boolean;
  bonuses: number;
  manualDeductions: number;
  netPay: number;
  deductionsCount: number;
}


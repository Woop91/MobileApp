// ============================================================================
// GroupUp Mobile - Type Definitions
// ============================================================================

/** User roles matching the GAS web app */
export type UserRole = 'steward' | 'member' | 'admin' | 'both';

/** Auth methods supported by the GAS backend */
export type AuthMethod = 'sso' | 'magic' | 'session';

/** Session info stored locally */
export interface SessionInfo {
  email: string;
  sessionToken: string;
  role: UserRole;
  method: AuthMethod;
  expiresAt: number;
  userName?: string;
}

/** User profile from Member Directory */
export interface UserProfile {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  unit: string;
  phone?: string;
  jobTitle?: string;
  duesStatus?: string;
  isDuesPaying?: boolean;
  memberId?: string;
  workLocation?: string;
  officeDays?: string;
  assignedSteward?: string;
  isSteward?: boolean;
  hireDate?: string;
  supervisor?: string;
  cubicle?: string;
  employeeId?: string;
}

/** Grievance case record */
export interface GrievanceCase {
  id: string;
  memberEmail: string;
  memberFirstName: string;
  memberLastName: string;
  status: string;
  step: string;
  deadline: string;
  filed: string;
  steward: string;
  unit: string;
  priority: string;
  notes: string;
  issueCategory: string;
  resolution?: string;
  dateClosed?: string;
  driveFolderUrl?: string;
}

/** Member record (steward view) */
export interface MemberRecord {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  unit: string;
  phone?: string;
  duesStatus: string;
  isDuesPaying: boolean;
  memberId: string;
  workLocation?: string;
  jobTitle?: string;
  hasOpenGrievance: boolean;
  assignedSteward?: string;
  hireDate?: string;
}

/** Steward KPIs */
export interface StewardKPIs {
  totalCases: number;
  overdue: number;
  dueSoon: number;
  resolved: number;
  activeCases: number;
}

/** Badge counts for navigation */
export interface BadgeCounts {
  cases?: number;
  tasks?: number;
  notifications?: number;
  messages?: number;
}

/** Task record */
export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  memberEmail?: string;
  priority: string;
  dueDate?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

/** Notification record */
export interface NotificationRecord {
  id: string;
  type: 'steward_message' | 'announcement' | 'deadline' | 'system';
  title: string;
  body: string;
  createdAt: string;
  expiresAt?: string;
  dismissed: boolean;
}

/** Survey question */
export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

/** Contact log entry */
export interface ContactLogEntry {
  date: string;
  type: string;
  notes: string;
  duration?: string;
  memberEmail?: string;
  memberName?: string;
}

/** Config from GAS backend */
export interface AppConfig {
  orgName: string;
  orgAbbrev: string;
  logoInitials: string;
  accentHue: number;
  stewardLabel: string;
  memberLabel: string;
  webAppUrl: string;
  themeKey?: string;
  enableGrievances?: boolean;
  enableWorkload?: boolean;
  enableSurvey?: boolean;
}

/** API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  authError?: boolean;
}

/** Grievance form options */
export interface GrievanceFormOptions {
  categories: string[];
  steps: string[];
  priorities: string[];
  units: string[];
  stewards: Array<{ email: string; name: string }>;
}

/** Meeting record */
export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  calendarLink?: string;
}

/** Workload entry */
export interface WorkloadEntry {
  weekOf: string;
  hoursWorked: number;
  casesHandled: number;
  meetingsAttended: number;
  notes?: string;
}

/** Weekly question */
export interface WeeklyQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'yes_no';
  weekOf: string;
}

/** Steward directory entry */
export interface StewardInfo {
  email: string;
  name: string;
  phone?: string;
  unit?: string;
  available: boolean;
}

/** Batch data response (initial load) */
export interface BatchData {
  config: AppConfig;
  user: UserProfile;
  role: UserRole;
  badges: BadgeCounts;
  notifications: NotificationRecord[];
  /** Steward-only fields */
  cases?: GrievanceCase[];
  kpis?: StewardKPIs;
  members?: MemberRecord[];
  tasks?: TaskRecord[];
  /** Member-only fields */
  grievances?: GrievanceCase[];
  assignedSteward?: StewardInfo;
  surveyStatus?: { available: boolean; completed: boolean };
}

/** Paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

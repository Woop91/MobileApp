// ============================================================================
// API Endpoints - Typed wrappers for all GAS data* functions
// ============================================================================

import { apiCall } from './client';
import type {
  BatchData,
  GrievanceCase,
  StewardKPIs,
  MemberRecord,
  TaskRecord,
  BadgeCounts,
  StewardInfo,
  GrievanceFormOptions,
  ContactLogEntry,
  MeetingRecord,
  ApiResponse,
  UserProfile,
} from '../types';

// ── Initialization & Batch ──────────────────────────────────────────────────

export function getBatchData() {
  return apiCall<BatchData>({ action: 'dataGetBatchData' });
}

export function getStewardDashboardInit() {
  return apiCall<BatchData>({ action: 'dataGetStewardDashboardInit' });
}

export function refreshNavData() {
  return apiCall<{ badges: BadgeCounts }>({ action: 'dataRefreshNavData' });
}

export function getWelcomeData() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetWelcomeData' });
}

export function markWelcomeDismissed() {
  return apiCall<void>({ action: 'dataMarkWelcomeDismissed' });
}

// ── Authentication ──────────────────────────────────────────────────────────

export function sendMagicLink(email: string, rememberMe: boolean) {
  return apiCall<{ message: string }>({
    action: 'sendMagicLink',
    params: { email, rememberMe },
    skipAuth: true,
  });
}

export function validateSession(sessionToken: string) {
  return apiCall<{ valid: boolean; email: string; role: string }>({
    action: 'validateMobileSession',
    params: { sessionToken },
    skipAuth: true,
  });
}

// ── Grievances / Cases ──────────────────────────────────────────────────────

export function getStewardCases() {
  return apiCall<{ cases: GrievanceCase[] }>({ action: 'dataGetStewardCases' });
}

export function getStewardKPIs() {
  return apiCall<StewardKPIs>({ action: 'dataGetStewardKPIs' });
}

export function getMemberGrievances() {
  return apiCall<{ grievances: GrievanceCase[] }>({ action: 'dataGetMemberGrievances' });
}

export function getMemberGrievanceHistory() {
  return apiCall<{ history: GrievanceCase[] }>({ action: 'dataGetMemberGrievanceHistory' });
}

export function getGrievanceFormOptions() {
  return apiCall<GrievanceFormOptions>({ action: 'dataGetGrievanceFormOptions' });
}

export function initiateGrievance(data: Record<string, unknown>, idemKey: string) {
  return apiCall<{ grievanceId: string }>({
    action: 'dataInitiateGrievance',
    params: { data, idemKey },
  });
}

export function startGrievanceDraft(data: Record<string, unknown>, idemKey: string) {
  return apiCall<{ draftId: string }>({
    action: 'dataStartGrievanceDraft',
    params: { data, idemKey },
  });
}

export function getGrievanceStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetGrievanceStats' });
}

export function getGrievanceHotSpots() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetGrievanceHotSpots' });
}

export function getCaseActivityLog(caseId: string) {
  return apiCall<Array<Record<string, unknown>>>({
    action: 'dataGetCaseActivityLog',
    params: { caseId },
  });
}

export function getCaseChecklist(caseId: string) {
  return apiCall<Array<Record<string, unknown>>>({
    action: 'dataGetCaseChecklist',
    params: { caseId },
  });
}

export function toggleChecklistItem(checklistId: string, completed: boolean) {
  return apiCall<{ success: boolean }>({
    action: 'dataToggleChecklistItem',
    params: { checklistId, completed },
  });
}

export function getDeadlineCalendarData() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetDeadlineCalendarData' });
}

// ── Members ─────────────────────────────────────────────────────────────────

export function getAllMembers() {
  return apiCall<{ members: MemberRecord[] }>({ action: 'dataGetAllMembers' });
}

export function getMembersPaginated(opts: { page: number; pageSize: number; search?: string; filter?: string }) {
  return apiCall<{ items: MemberRecord[]; total: number; hasMore: boolean }>({
    action: 'dataGetMembersPaginated',
    params: { opts },
  });
}

export function getFullProfile(email?: string) {
  return apiCall<UserProfile>({
    action: 'dataGetFullProfile',
    params: { email },
  });
}

export function updateProfile(updates: Partial<UserProfile>) {
  return apiCall<{ success: boolean }>({
    action: 'dataUpdateProfile',
    params: { updates },
  });
}

export function getMemberCount() {
  return apiCall<{ count: number }>({ action: 'dataGetMemberCount' });
}

export function getStewardMemberStats() {
  return apiCall<{ total: number; byLocation: Record<string, number>; byDues: Record<string, number> }>({
    action: 'dataGetStewardMemberStats',
  });
}

// ── Steward Management ──────────────────────────────────────────────────────

export function getAssignedSteward() {
  return apiCall<StewardInfo>({ action: 'dataGetAssignedSteward' });
}

export function getAvailableStewards() {
  return apiCall<StewardInfo[]>({ action: 'dataGetAvailableStewards' });
}

export function getStewardDirectory() {
  return apiCall<StewardInfo[]>({ action: 'dataGetStewardDirectory' });
}

export function assignSteward(memberEmail: string, stewardEmail: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataAssignSteward',
    params: { memberEmail, stewardEmail },
  });
}

export function memberAssignSteward(stewardEmail: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataMemberAssignSteward',
    params: { stewardEmail },
  });
}

export function isChiefSteward() {
  return apiCall<boolean>({ action: 'dataIsChiefSteward' });
}

export function getAllStewardPerformance() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetAllStewardPerformance' });
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export function getTasks(statusFilter?: string) {
  return apiCall<TaskRecord[]>({
    action: 'dataGetTasks',
    params: { statusFilter },
  });
}

export function createTask(title: string, desc: string, memberEmail: string, priority: string, dueDate: string, assignToEmail?: string, idemKey?: string) {
  return apiCall<{ taskId: string }>({
    action: 'dataCreateTask',
    params: { title, desc, memberEmail, priority, dueDate, assignToEmail, idemKey },
  });
}

export function completeTask(taskId: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataCompleteTask',
    params: { taskId },
  });
}

export function updateTask(taskId: string, updates: Record<string, unknown>) {
  return apiCall<{ success: boolean }>({
    action: 'dataUpdateTask',
    params: { taskId, updates },
  });
}

export function getMemberTasks(statusFilter?: string) {
  return apiCall<TaskRecord[]>({
    action: 'dataGetMemberTasks',
    params: { statusFilter },
  });
}

export function completeMemberTask(taskId: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataCompleteMemberTask',
    params: { taskId },
  });
}

// ── Contact Log ─────────────────────────────────────────────────────────────

export function logMemberContact(memberEmail: string, type: string, notes: string, duration?: string, memberName?: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataLogMemberContact',
    params: { memberEmail, type, notes, duration, memberName },
  });
}

export function getMemberContactHistory(memberEmail: string) {
  return apiCall<ContactLogEntry[]>({
    action: 'dataGetMemberContactHistory',
    params: { memberEmail },
  });
}

export function getStewardContactLog() {
  return apiCall<ContactLogEntry[]>({ action: 'dataGetStewardContactLog' });
}

// ── Surveys ─────────────────────────────────────────────────────────────────

export function getSurveyStatus() {
  return apiCall<{ available: boolean; completed: boolean }>({ action: 'dataGetSurveyStatus' });
}

export function getSurveyQuestions() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetSurveyQuestions' });
}

export function submitSurveyResponse(responses: Record<string, unknown>) {
  return apiCall<{ success: boolean }>({
    action: 'dataSubmitSurveyResponse',
    params: { responses },
  });
}

export function getSurveyResults() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetSurveyResults' });
}

export function getStewardSurveyTracking(scope?: string) {
  return apiCall<{ total: number; completed: number; members: Array<Record<string, unknown>> }>({
    action: 'dataGetStewardSurveyTracking',
    params: { scope },
  });
}

export function getSatisfactionTrends() {
  return apiCall<{ categories: Array<Record<string, unknown>> }>({ action: 'dataGetSatisfactionTrends' });
}

// ── Notifications & Messaging ───────────────────────────────────────────────

export function getBadgeCounts() {
  return apiCall<BadgeCounts>({ action: 'dataGetBadgeCounts' });
}

export function sendDirectMessage(memberEmail: string, subject: string, body: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataSendDirectMessage',
    params: { memberEmail, subject, body },
  });
}

export function sendBroadcast(filter: Record<string, unknown>, msg: string, subject: string) {
  return apiCall<{ success: boolean; sent: number }>({
    action: 'dataSendBroadcast',
    params: { filter, msg, subject },
  });
}

export function getBroadcastFilterOptions() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetBroadcastFilterOptions' });
}

// ── Meetings ────────────────────────────────────────────────────────────────

export function getMemberMeetings() {
  return apiCall<MeetingRecord[]>({ action: 'dataGetMemberMeetings' });
}

export function getUpcomingEvents(limit?: number) {
  return apiCall<MeetingRecord[]>({
    action: 'dataGetUpcomingEvents',
    params: { limit },
  });
}

export function getMeetingMinutes(limit?: number) {
  return apiCall<Array<Record<string, unknown>>>({
    action: 'dataGetMeetingMinutes',
    params: { limit },
  });
}

// ── Feedback ────────────────────────────────────────────────────────────────

export function submitFeedback(data: Record<string, unknown>, idemKey: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataSubmitFeedback',
    params: { data, idemKey },
  });
}

export function getMyFeedback() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetMyFeedback' });
}

export function getPendingGrievanceFeedback() {
  return apiCall<Record<string, unknown> | null>({ action: 'dataGetPendingGrievanceFeedback' });
}

export function submitGrievanceFeedback(grievanceId: string, ratings: Record<string, number>, comment: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataSubmitGrievanceFeedback',
    params: { grievanceId, ratings, comment },
  });
}

// ── Insights & Analytics ────────────────────────────────────────────────────

export function getInsightsBatch() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetInsightsBatch' });
}

export function getMembershipStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetMembershipStats' });
}

export function getEngagementStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetEngagementStats' });
}

export function getMyEngagementScore() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetMyEngagementScore' });
}

export function getResourceStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetResourceStats' });
}

export function getCorrelationAlerts() {
  return apiCall<Array<Record<string, unknown>>>({ action: 'dataGetCorrelationAlerts' });
}

export function getUsageStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetUsageStats' });
}

// ── Search ──────────────────────────────────────────────────────────────────

export function webAppSearch(query: string, tab?: string) {
  return apiCall<Array<Record<string, unknown>>>({
    action: 'dataGetWebAppSearchResults',
    params: { query, tab },
  });
}

// ── Workload ────────────────────────────────────────────────────────────────

export function getWorkloadSummaryStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetWorkloadSummaryStats' });
}

// ── Bulk Operations (Steward) ───────────────────────────────────────────────

export function bulkUpdateStatus(caseIds: string[], newStatus: string) {
  return apiCall<{ success: boolean; updated: number }>({
    action: 'dataBulkUpdateStatus',
    params: { caseIds, newStatus },
  });
}

export function bulkExportCsv(caseIds: string[]) {
  return apiCall<{ csv: string }>({
    action: 'dataBulkExportCsv',
    params: { caseIds },
  });
}

// ── Theme ───────────────────────────────────────────────────────────────────

export function applyColorTheme(themeKey: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataApplyColorTheme',
    params: { themeKey },
  });
}

export function setDefaultView(viewPref: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataSetDefaultView',
    params: { viewPref },
  });
}

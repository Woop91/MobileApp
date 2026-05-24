// ============================================================================
// API Endpoints - Typed wrappers for GAS data* functions used in the app
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
  UserProfile,
} from '../types';

// ── Initialization & Batch ──────────────────────────────────────────────────

export function getBatchData() {
  return apiCall<BatchData>({ action: 'dataGetBatchData' });
}

export function refreshNavData() {
  return apiCall<{ badges: BadgeCounts }>({ action: 'dataRefreshNavData' });
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

export function getGrievanceFormOptions() {
  return apiCall<GrievanceFormOptions>({ action: 'dataGetGrievanceFormOptions' });
}

export function initiateGrievance(data: Record<string, unknown>, idemKey: string) {
  return apiCall<{ grievanceId: string }>({
    action: 'dataInitiateGrievance',
    params: { data, idemKey },
  });
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

// ── Members ─────────────────────────────────────────────────────────────────

export function getAllMembers() {
  return apiCall<{ members: MemberRecord[] }>({ action: 'dataGetAllMembers' });
}

export function getFullProfile(email?: string) {
  return apiCall<UserProfile>({
    action: 'dataGetFullProfile',
    params: { email },
  });
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

// ── Meetings ────────────────────────────────────────────────────────────────

export function getUpcomingEvents(limit?: number) {
  return apiCall<MeetingRecord[]>({
    action: 'dataGetUpcomingEvents',
    params: { limit },
  });
}

// ── Insights & Analytics ────────────────────────────────────────────────────

export function getInsightsBatch() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetInsightsBatch' });
}

export function getResourceStats() {
  return apiCall<Record<string, unknown>>({ action: 'dataGetResourceStats' });
}

/** Log a resource click for analytics */
export function logResourceClick(resourceId: string, title: string) {
  return apiCall<{ success: boolean }>({
    action: 'dataLogResourceClick',
    params: { resourceId, title },
  });
}

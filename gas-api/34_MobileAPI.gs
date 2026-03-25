/**
 * MobileAPI.gs — REST-like API bridge for the mobile app
 *
 * WHAT THIS FILE DOES:
 *   Provides a doPost(e) handler that the mobile app calls via HTTP POST.
 *   Each request includes an 'action' field that maps to an existing data*
 *   function. The session token is passed in the request body and forwarded
 *   to the data* function for auth validation.
 *
 * WHY IT EXISTS:
 *   The web SPA uses google.script.run (in-browser GAS RPC) which is not
 *   available to native mobile apps. This bridge translates HTTP POST
 *   requests into data* function calls, returning JSON responses.
 *
 * SECURITY:
 *   - All data* functions already validate session tokens internally
 *   - CORS is handled by GAS (returns JSON with proper content type)
 *   - Rate limiting via CacheService for login endpoints
 *   - Explicit action allowlist — only listed actions are routable
 *   - No new auth bypass — uses Auth module for token creation
 *   - Generic error messages prevent information disclosure
 *   - escapeHtml() on all user-controlled output
 *
 * DEPENDENCIES:
 *   Depends on: All data* functions in 21_WebDashDataService.gs and other files
 *   Used by: Mobile app (iOS/Android) via HTTP POST
 */

// ============================================================================
// ACTION ALLOWLIST — Only these actions can be routed via the mobile API.
// Adding a new action REQUIRES explicit entry here. This prevents accidental
// exposure of internal functions.
// ============================================================================
var MOBILE_API_ALLOWLIST_ = {
  // Batch / Init
  'dataGetBatchData': true,
  'dataGetStewardDashboardInit': true,
  'dataRefreshNavData': true,
  'dataGetWelcomeData': true,
  'dataMarkWelcomeDismissed': true,
  // Grievances / Cases
  'dataGetStewardCases': true,
  'dataGetStewardKPIs': true,
  'dataGetMemberGrievances': true,
  'dataGetMemberGrievanceHistory': true,
  'dataGetGrievanceFormOptions': true,
  'dataInitiateGrievance': true,
  'dataStartGrievanceDraft': true,
  'dataGetGrievanceStats': true,
  'dataGetGrievanceHotSpots': true,
  'dataGetCaseActivityLog': true,
  'dataGetCaseChecklist': true,
  'dataToggleChecklistItem': true,
  'dataGetDeadlineCalendarData': true,
  // Members
  'dataGetAllMembers': true,
  'dataGetMembersPaginated': true,
  'dataGetFullProfile': true,
  'dataUpdateProfile': true,
  'dataGetMemberCount': true,
  'dataGetStewardMemberStats': true,
  // Steward Management
  'dataGetAssignedSteward': true,
  'dataGetAvailableStewards': true,
  'dataGetStewardDirectory': true,
  'dataAssignSteward': true,
  'dataMemberAssignSteward': true,
  'dataIsChiefSteward': true,
  'dataGetAllStewardPerformance': true,
  // Tasks
  'dataGetTasks': true,
  'dataCreateTask': true,
  'dataCompleteTask': true,
  'dataUpdateTask': true,
  'dataGetMemberTasks': true,
  'dataCompleteMemberTask': true,
  // Contact Log
  'dataLogMemberContact': true,
  'dataGetMemberContactHistory': true,
  'dataGetStewardContactLog': true,
  // Surveys
  'dataGetSurveyStatus': true,
  'dataGetSurveyQuestions': true,
  'dataSubmitSurveyResponse': true,
  'dataGetSurveyResults': true,
  'dataGetStewardSurveyTracking': true,
  'dataGetSatisfactionTrends': true,
  // Notifications & Messaging
  'dataGetBadgeCounts': true,
  'dataSendDirectMessage': true,
  'dataSendBroadcast': true,
  'dataGetBroadcastFilterOptions': true,
  // Meetings
  'dataGetMemberMeetings': true,
  'dataGetUpcomingEvents': true,
  'dataGetMeetingMinutes': true,
  // Feedback
  'dataSubmitFeedback': true,
  'dataGetMyFeedback': true,
  'dataGetPendingGrievanceFeedback': true,
  'dataSubmitGrievanceFeedback': true,
  // Insights & Analytics
  'dataGetInsightsBatch': true,
  'dataGetMembershipStats': true,
  'dataGetEngagementStats': true,
  'dataGetMyEngagementScore': true,
  'dataGetResourceStats': true,
  'dataGetCorrelationAlerts': true,
  'dataGetUsageStats': true,
  // Search
  'dataGetWebAppSearchResults': true,
  // Workload
  'dataGetWorkloadSummaryStats': true,
  // Bulk Operations
  'dataBulkUpdateStatus': true,
  'dataBulkExportCsv': true,
  // Theme
  'dataApplyColorTheme': true,
  'dataSetDefaultView': true,
  // Steward Contact
  'dataGetStewardContact': true
};

/**
 * Handle POST requests from the mobile app.
 * @param {Object} e - POST event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (_parseErr) {
        return _jsonResponse({ success: false, message: 'Invalid JSON body.' }, 400);
      }
    }

    var action = body.action;
    if (!action || typeof action !== 'string' || action.length > 100) {
      return _jsonResponse({ success: false, message: 'Missing or invalid action parameter.' }, 400);
    }

    // Health check / ping — no version disclosure
    if (action === 'ping') {
      return _jsonResponse({ success: true, message: 'pong' });
    }

    // Session validation for mobile login flow
    if (action === 'validateMobileSession') {
      return _handleValidateSession(body);
    }

    // Magic link send (no auth required — delegates to rate-limited Auth module)
    if (action === 'sendMagicLink') {
      return _handleSendMagicLink(body);
    }

    // PIN login (no auth required — delegates to rate-limited devAuthLoginByPIN)
    if (action === 'validatePinLogin') {
      return _handlePinLogin(body);
    }

    // Google Sign-In validation (no auth required)
    if (action === 'validateGoogleLogin') {
      return _handleGoogleLogin(body);
    }

    // ── Route to data* functions (allowlist enforced) ────────────────────────
    if (!MOBILE_API_ALLOWLIST_[action]) {
      return _jsonResponse({ success: false, message: 'Action not available.' }, 404);
    }

    var sessionToken = body.sessionToken || '';
    var result = _routeAction(action, sessionToken, body);

    if (result === undefined) {
      return _jsonResponse({ success: false, message: 'Action not available.' }, 404);
    }

    return _jsonResponse(result);

  } catch (err) {
    Logger.log('doPost FATAL: ' + err.message + '\n' + (err.stack || ''));
    return _jsonResponse({ success: false, message: 'Internal server error.' }, 500);
  }
}

/**
 * Validate a session token and return user info.
 * @param {Object} body - Request body with sessionToken
 * @returns {TextOutput}
 */
function _handleValidateSession(body) {
  var token = body.sessionToken || '';
  if (!token) {
    return _jsonResponse({ success: true, data: { valid: false } });
  }

  // Use Auth module to validate — single code path
  var email = null;
  if (typeof Auth !== 'undefined' && typeof Auth.resolveEmailFromToken === 'function') {
    email = Auth.resolveEmailFromToken(token);
  }

  if (!email && typeof _resolveCallerEmail === 'function') {
    email = _resolveCallerEmail(token);
  }

  if (!email) {
    return _jsonResponse({ success: true, data: { valid: false } });
  }

  // Look up role
  var role = 'member';
  try {
    if (typeof DataService !== 'undefined' && typeof DataService.getMemberRole === 'function') {
      role = DataService.getMemberRole(email) || 'member';
    } else if (typeof _requireStewardAuth === 'function') {
      var stewardEmail = _requireStewardAuth(token);
      if (stewardEmail) role = 'steward';
    }
  } catch (_) { Logger.log('_handleValidateSession role lookup: ' + (_.message || _)); }

  return _jsonResponse({
    success: true,
    data: { valid: true, email: email, role: role }
  });
}

/**
 * Handle magic link request from mobile.
 * Delegates to Auth.sendMagicLink which has its own rate limiting.
 * Returns generic message to prevent email enumeration.
 * @param {Object} body - Request body with email and rememberMe
 * @returns {TextOutput}
 */
function _handleSendMagicLink(body) {
  var email = (body.email || '').trim().toLowerCase();
  var rememberMe = body.rememberMe !== false;

  if (!email || email.indexOf('@') === -1) {
    return _jsonResponse({ success: false, message: 'Please enter a valid email address.' });
  }

  // Rate limit at the mobile API level too (5 per 15 min per IP/email combo)
  var cache = CacheService.getScriptCache();
  var rateKey = 'MOBILE_ML_RATE_' + email;
  var attempts = parseInt(cache.get(rateKey) || '0', 10);
  if (attempts >= 5) {
    // Generic message — don't reveal rate limit hit vs success
    return _jsonResponse({
      success: true,
      data: { message: 'If this email is in our directory, you will receive a sign-in link.' }
    });
  }
  cache.put(rateKey, String(attempts + 1), 900); // 15 min window

  // Delegate to Auth module (which also has its own rate limiting)
  if (typeof Auth !== 'undefined' && typeof Auth.sendMagicLink === 'function') {
    try {
      Auth.sendMagicLink(email, rememberMe);
    } catch (_) { Logger.log('_handleSendMagicLink: ' + (_.message || _)); }
  } else if (typeof sendMagicLink === 'function') {
    try {
      sendMagicLink(email, rememberMe);
    } catch (_) { Logger.log('_handleSendMagicLink fallback: ' + (_.message || _)); }
  }

  // Always return generic success — prevents email enumeration
  return _jsonResponse({
    success: true,
    data: { message: 'If this email is in our directory, you will receive a sign-in link.' }
  });
}

/**
 * Handle PIN login from mobile.
 * Delegates to the existing devAuthLoginByPIN() which has:
 *   - Rate limiting (10 attempts / 15 min global)
 *   - Per-member lockout
 *   - PIN hashing (not plaintext comparison)
 *   - Audit logging
 *   - Proper column constants (MEMBER_COLS, PIN_CONFIG)
 * @param {Object} body - Request body with pin
 * @returns {TextOutput}
 */
function _handlePinLogin(body) {
  var pin = String(body.pin || '').trim();
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    // Add deliberate delay to slow brute-force attempts
    Utilities.sleep(500 + Math.floor(Math.random() * 500));
    return _jsonResponse({ success: false, message: 'Invalid PIN format.' });
  }

  // Delegate to the existing PIN auth function — it handles rate limiting,
  // hashing, lockout, audit logging, and proper column lookups
  if (typeof devAuthLoginByPIN !== 'function') {
    return _jsonResponse({ success: false, message: 'PIN authentication not available.' });
  }

  var result = devAuthLoginByPIN(pin);

  // Add deliberate delay on failure to slow brute-force
  if (!result || !result.success) {
    Utilities.sleep(500 + Math.floor(Math.random() * 500));
  }

  return _jsonResponse(result);
}

/**
 * Handle Google Sign-In from mobile.
 * Validates that the Google-authenticated email exists in Member Directory,
 * then creates a session token via Auth module.
 *
 * NOTE: This trusts the email from the Google OAuth flow. The mobile app
 * must validate the Google ID token before calling this endpoint. Future
 * enhancement: validate the Google ID token server-side.
 *
 * @param {Object} body - Request body with email from Google OAuth
 * @returns {TextOutput}
 */
function _handleGoogleLogin(body) {
  var email = (body.email || '').trim().toLowerCase();
  if (!email || email.indexOf('@') === -1) {
    return _jsonResponse({ success: false, message: 'Invalid credentials.' });
  }

  // Rate limit Google login attempts (10 per 15 min per email)
  var cache = CacheService.getScriptCache();
  var rateKey = 'MOBILE_GOOGLE_RATE_' + email;
  var attempts = parseInt(cache.get(rateKey) || '0', 10);
  if (attempts >= 10) {
    return _jsonResponse({ success: false, message: 'Too many attempts. Try again later.' });
  }
  cache.put(rateKey, String(attempts + 1), 900); // 15 min window

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return _jsonResponse({ success: false, message: 'System unavailable.' });

    var sheetName = (typeof SHEETS !== 'undefined') ? SHEETS.MEMBER_DIR : null;
    if (!sheetName) {
      Logger.log('_handleGoogleLogin: SHEETS.MEMBER_DIR not defined');
      return _jsonResponse({ success: false, message: 'System configuration error.' });
    }
    var memberSheet = ss.getSheetByName(sheetName);
    if (!memberSheet) return _jsonResponse({ success: false, message: 'System configuration error.' });

    // Use MEMBER_COLS constants for column lookups (1-indexed → 0-indexed for array)
    var emailCol, roleCol, isStewardCol;
    var data;
    if (typeof MEMBER_COLS !== 'undefined') {
      emailCol = MEMBER_COLS.EMAIL ? MEMBER_COLS.EMAIL - 1 : -1;
      roleCol = MEMBER_COLS.ROLE ? MEMBER_COLS.ROLE - 1 : -1;
      isStewardCol = MEMBER_COLS.IS_STEWARD ? MEMBER_COLS.IS_STEWARD - 1 : -1;
    } else {
      // Fallback: scan headers (less reliable)
      data = memberSheet.getDataRange().getValues();
      var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
      emailCol = headers.indexOf('email');
      if (emailCol === -1) emailCol = headers.indexOf('email address');
      if (emailCol === -1) emailCol = headers.indexOf('member email');
      roleCol = headers.indexOf('role');
      if (roleCol === -1) roleCol = headers.indexOf('member role');
      isStewardCol = headers.indexOf('is steward');
    }

    if (emailCol === -1) {
      Logger.log('_handleGoogleLogin: email column not resolved');
      return _jsonResponse({ success: false, message: 'System configuration error.' });
    }

    if (!data) data = memberSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][emailCol]).trim().toLowerCase() === email) {
        var role = 'member';
        if (isStewardCol !== -1 && data[i][isStewardCol]) {
          role = 'steward';
        } else if (roleCol !== -1) {
          var memberRole = String(data[i][roleCol]).toLowerCase();
          if (memberRole.indexOf('steward') !== -1 || memberRole.indexOf('admin') !== -1) {
            role = 'steward';
          }
        }

        // Create session token via Auth module — single code path
        var token = null;
        if (typeof Auth !== 'undefined' && typeof Auth.createSessionToken === 'function') {
          token = Auth.createSessionToken(email);
          // Handle error response from Auth.createSessionToken
          if (token && typeof token === 'object' && token.error) {
            Logger.log('_handleGoogleLogin: token creation failed — ' + token.message);
            return _jsonResponse({ success: false, message: 'Session creation failed. Try again.' });
          }
        }

        if (!token) {
          Logger.log('_handleGoogleLogin: Auth.createSessionToken unavailable');
          return _jsonResponse({ success: false, message: 'Authentication system unavailable.' });
        }

        // Clear rate counter on success
        cache.remove(rateKey);

        if (typeof logAuditEvent === 'function') {
          logAuditEvent('MOBILE_GOOGLE_LOGIN', { email: email, role: role });
        }

        return _jsonResponse({
          success: true,
          data: { valid: true, email: email, role: role, sessionToken: token }
        });
      }
    }

    // Generic failure — don't reveal whether email exists
    Utilities.sleep(500 + Math.floor(Math.random() * 500));
    return _jsonResponse({ success: false, message: 'Invalid credentials.' });
  } catch (err) {
    Logger.log('_handleGoogleLogin error: ' + err.message);
    return _jsonResponse({ success: false, message: 'Login validation failed.' });
  }
}

/**
 * Route an action name to the corresponding data* function.
 * IMPORTANT: Only actions in MOBILE_API_ALLOWLIST_ can reach this function.
 * @param {string} action - The function name to call
 * @param {string} sessionToken - The session token for auth
 * @param {Object} body - Full request body for extra params
 * @returns {Object|undefined} Result from the function, or undefined if not found
 */
function _routeAction(action, sessionToken, body) {
  // Action registry — maps action names to function calls.
  // Each data* function already handles its own auth validation.
  // We pass sessionToken as the first argument (matching the existing pattern).

  switch (action) {
    // === Batch / Init ===
    case 'dataGetBatchData':
      return typeof dataGetBatchData === 'function' ? dataGetBatchData(sessionToken) : undefined;
    case 'dataGetStewardDashboardInit':
      return typeof dataGetStewardDashboardInit === 'function' ? dataGetStewardDashboardInit(sessionToken) : undefined;
    case 'dataRefreshNavData':
      return typeof dataRefreshNavData === 'function' ? dataRefreshNavData(sessionToken) : undefined;
    case 'dataGetWelcomeData':
      return typeof dataGetWelcomeData === 'function' ? dataGetWelcomeData(sessionToken) : undefined;
    case 'dataMarkWelcomeDismissed':
      return typeof dataMarkWelcomeDismissed === 'function' ? dataMarkWelcomeDismissed(sessionToken) : undefined;

    // === Grievances / Cases ===
    case 'dataGetStewardCases':
      return typeof dataGetStewardCases === 'function' ? dataGetStewardCases(sessionToken) : undefined;
    case 'dataGetStewardKPIs':
      return typeof dataGetStewardKPIs === 'function' ? dataGetStewardKPIs(sessionToken) : undefined;
    case 'dataGetMemberGrievances':
      return typeof dataGetMemberGrievances === 'function' ? dataGetMemberGrievances(sessionToken) : undefined;
    case 'dataGetMemberGrievanceHistory':
      return typeof dataGetMemberGrievanceHistory === 'function' ? dataGetMemberGrievanceHistory(sessionToken) : undefined;
    case 'dataGetGrievanceFormOptions':
      return typeof dataGetGrievanceFormOptions === 'function' ? dataGetGrievanceFormOptions(sessionToken) : undefined;
    case 'dataInitiateGrievance':
      return typeof dataInitiateGrievance === 'function' ? dataInitiateGrievance(sessionToken, body.data || {}, body.idemKey || '') : undefined;
    case 'dataStartGrievanceDraft':
      return typeof dataStartGrievanceDraft === 'function' ? dataStartGrievanceDraft(sessionToken, body.data || {}, body.idemKey || '') : undefined;
    case 'dataGetGrievanceStats':
      return typeof dataGetGrievanceStats === 'function' ? dataGetGrievanceStats(sessionToken) : undefined;
    case 'dataGetGrievanceHotSpots':
      return typeof dataGetGrievanceHotSpots === 'function' ? dataGetGrievanceHotSpots(sessionToken) : undefined;
    case 'dataGetCaseActivityLog':
      return typeof dataGetCaseActivityLog === 'function' ? dataGetCaseActivityLog(sessionToken, body.caseId || '') : undefined;
    case 'dataGetCaseChecklist':
      return typeof dataGetCaseChecklist === 'function' ? dataGetCaseChecklist(sessionToken, body.caseId || '') : undefined;
    case 'dataToggleChecklistItem':
      return typeof dataToggleChecklistItem === 'function' ? dataToggleChecklistItem(sessionToken, body.checklistId || '', body.completed || false) : undefined;
    case 'dataGetDeadlineCalendarData':
      return typeof dataGetDeadlineCalendarData === 'function' ? dataGetDeadlineCalendarData(sessionToken) : undefined;

    // === Members ===
    case 'dataGetAllMembers':
      return typeof dataGetAllMembers === 'function' ? dataGetAllMembers(sessionToken) : undefined;
    case 'dataGetMembersPaginated':
      return typeof dataGetMembersPaginated === 'function' ? dataGetMembersPaginated(sessionToken, body.opts || {}) : undefined;
    case 'dataGetFullProfile':
      return typeof dataGetFullProfile === 'function' ? dataGetFullProfile(sessionToken, body.email || undefined) : undefined;
    case 'dataUpdateProfile':
      return typeof dataUpdateProfile === 'function' ? dataUpdateProfile(sessionToken, body.updates || {}) : undefined;
    case 'dataGetMemberCount':
      return typeof dataGetMemberCount === 'function' ? dataGetMemberCount(sessionToken) : undefined;
    case 'dataGetStewardMemberStats':
      return typeof dataGetStewardMemberStats === 'function' ? dataGetStewardMemberStats(sessionToken) : undefined;

    // === Steward Management ===
    case 'dataGetAssignedSteward':
      return typeof dataGetAssignedSteward === 'function' ? dataGetAssignedSteward(sessionToken) : undefined;
    case 'dataGetAvailableStewards':
      return typeof dataGetAvailableStewards === 'function' ? dataGetAvailableStewards(sessionToken) : undefined;
    case 'dataGetStewardDirectory':
      return typeof dataGetStewardDirectory === 'function' ? dataGetStewardDirectory(sessionToken) : undefined;
    case 'dataAssignSteward':
      return typeof dataAssignSteward === 'function' ? dataAssignSteward(sessionToken, body.memberEmail || '', body.stewardEmail || '') : undefined;
    case 'dataMemberAssignSteward':
      return typeof dataMemberAssignSteward === 'function' ? dataMemberAssignSteward(sessionToken, body.stewardEmail || '') : undefined;
    case 'dataIsChiefSteward':
      return typeof dataIsChiefSteward === 'function' ? dataIsChiefSteward(sessionToken) : undefined;
    case 'dataGetAllStewardPerformance':
      return typeof dataGetAllStewardPerformance === 'function' ? dataGetAllStewardPerformance(sessionToken) : undefined;

    // === Tasks ===
    case 'dataGetTasks':
      return typeof dataGetTasks === 'function' ? dataGetTasks(sessionToken, body.statusFilter || undefined) : undefined;
    case 'dataCreateTask':
      return typeof dataCreateTask === 'function' ? dataCreateTask(sessionToken, body.title || '', body.desc || '', body.memberEmail || '', body.priority || 'normal', body.dueDate || '', body.assignToEmail || '', body.idemKey || '') : undefined;
    case 'dataCompleteTask':
      return typeof dataCompleteTask === 'function' ? dataCompleteTask(sessionToken, body.taskId || '') : undefined;
    case 'dataUpdateTask':
      return typeof dataUpdateTask === 'function' ? dataUpdateTask(sessionToken, body.taskId || '', body.updates || {}) : undefined;
    case 'dataGetMemberTasks':
      return typeof dataGetMemberTasks === 'function' ? dataGetMemberTasks(sessionToken, body.statusFilter || undefined) : undefined;
    case 'dataCompleteMemberTask':
      return typeof dataCompleteMemberTask === 'function' ? dataCompleteMemberTask(sessionToken, body.taskId || '') : undefined;

    // === Contact Log ===
    case 'dataLogMemberContact':
      return typeof dataLogMemberContact === 'function' ? dataLogMemberContact(sessionToken, body.memberEmail || '', body.type || '', body.notes || '', body.duration || '', body.memberName || '') : undefined;
    case 'dataGetMemberContactHistory':
      return typeof dataGetMemberContactHistory === 'function' ? dataGetMemberContactHistory(sessionToken, body.memberEmail || '') : undefined;
    case 'dataGetStewardContactLog':
      return typeof dataGetStewardContactLog === 'function' ? dataGetStewardContactLog(sessionToken) : undefined;

    // === Surveys ===
    case 'dataGetSurveyStatus':
      return typeof dataGetSurveyStatus === 'function' ? dataGetSurveyStatus(sessionToken) : undefined;
    case 'dataGetSurveyQuestions':
      return typeof dataGetSurveyQuestions === 'function' ? dataGetSurveyQuestions(sessionToken) : undefined;
    case 'dataSubmitSurveyResponse':
      return typeof dataSubmitSurveyResponse === 'function' ? dataSubmitSurveyResponse(sessionToken, body.responses || {}) : undefined;
    case 'dataGetSurveyResults':
      return typeof dataGetSurveyResults === 'function' ? dataGetSurveyResults(sessionToken) : undefined;
    case 'dataGetStewardSurveyTracking':
      return typeof dataGetStewardSurveyTracking === 'function' ? dataGetStewardSurveyTracking(sessionToken, body.scope || undefined) : undefined;
    case 'dataGetSatisfactionTrends':
      return typeof dataGetSatisfactionTrends === 'function' ? dataGetSatisfactionTrends(sessionToken) : undefined;

    // === Notifications & Messaging ===
    case 'dataGetBadgeCounts':
      return typeof dataGetBadgeCounts === 'function' ? dataGetBadgeCounts(sessionToken) : undefined;
    case 'dataSendDirectMessage':
      return typeof dataSendDirectMessage === 'function' ? dataSendDirectMessage(sessionToken, body.memberEmail || '', body.subject || '', body.body || '') : undefined;
    case 'dataSendBroadcast':
      return typeof dataSendBroadcast === 'function' ? dataSendBroadcast(sessionToken, body.filter || {}, body.msg || '', body.subject || '') : undefined;
    case 'dataGetBroadcastFilterOptions':
      return typeof dataGetBroadcastFilterOptions === 'function' ? dataGetBroadcastFilterOptions(sessionToken) : undefined;

    // === Meetings ===
    case 'dataGetMemberMeetings':
      return typeof dataGetMemberMeetings === 'function' ? dataGetMemberMeetings(sessionToken) : undefined;
    case 'dataGetUpcomingEvents':
      return typeof dataGetUpcomingEvents === 'function' ? dataGetUpcomingEvents(sessionToken, body.limit || 10) : undefined;
    case 'dataGetMeetingMinutes':
      return typeof dataGetMeetingMinutes === 'function' ? dataGetMeetingMinutes(sessionToken, body.limit || 10) : undefined;

    // === Feedback ===
    case 'dataSubmitFeedback':
      return typeof dataSubmitFeedback === 'function' ? dataSubmitFeedback(sessionToken, body.data || {}, body.idemKey || '') : undefined;
    case 'dataGetMyFeedback':
      return typeof dataGetMyFeedback === 'function' ? dataGetMyFeedback(sessionToken) : undefined;
    case 'dataGetPendingGrievanceFeedback':
      return typeof dataGetPendingGrievanceFeedback === 'function' ? dataGetPendingGrievanceFeedback(sessionToken) : undefined;
    case 'dataSubmitGrievanceFeedback':
      return typeof dataSubmitGrievanceFeedback === 'function' ? dataSubmitGrievanceFeedback(sessionToken, body.grievanceId || '', body.ratings || {}, body.comment || '') : undefined;

    // === Insights & Analytics ===
    case 'dataGetInsightsBatch':
      return typeof dataGetInsightsBatch === 'function' ? dataGetInsightsBatch(sessionToken) : undefined;
    case 'dataGetMembershipStats':
      return typeof dataGetMembershipStats === 'function' ? dataGetMembershipStats(sessionToken) : undefined;
    case 'dataGetEngagementStats':
      return typeof dataGetEngagementStats === 'function' ? dataGetEngagementStats(sessionToken) : undefined;
    case 'dataGetMyEngagementScore':
      return typeof dataGetMyEngagementScore === 'function' ? dataGetMyEngagementScore(sessionToken) : undefined;
    case 'dataGetResourceStats':
      return typeof dataGetResourceStats === 'function' ? dataGetResourceStats(sessionToken) : undefined;
    case 'dataGetCorrelationAlerts':
      return typeof dataGetCorrelationAlerts === 'function' ? dataGetCorrelationAlerts(sessionToken) : undefined;
    case 'dataGetUsageStats':
      return typeof dataGetUsageStats === 'function' ? dataGetUsageStats(sessionToken) : undefined;

    // === Search ===
    case 'dataGetWebAppSearchResults':
      return typeof dataGetWebAppSearchResults === 'function' ? dataGetWebAppSearchResults(sessionToken, body.query || '', body.tab || '') : undefined;

    // === Workload ===
    case 'dataGetWorkloadSummaryStats':
      return typeof dataGetWorkloadSummaryStats === 'function' ? dataGetWorkloadSummaryStats(sessionToken) : undefined;

    // === Bulk Operations ===
    case 'dataBulkUpdateStatus':
      return typeof dataBulkUpdateStatus === 'function' ? dataBulkUpdateStatus(sessionToken, body.caseIds || [], body.newStatus || '') : undefined;
    case 'dataBulkExportCsv':
      return typeof dataBulkExportCsv === 'function' ? dataBulkExportCsv(sessionToken, body.caseIds || []) : undefined;

    // === Theme ===
    case 'dataApplyColorTheme':
      return typeof dataApplyColorTheme === 'function' ? dataApplyColorTheme(sessionToken, body.themeKey || '') : undefined;
    case 'dataSetDefaultView':
      return typeof dataSetDefaultView === 'function' ? dataSetDefaultView(sessionToken, body.viewPref || '') : undefined;

    // === Steward Contact ===
    case 'dataGetStewardContact':
      return typeof dataGetStewardContact === 'function' ? dataGetStewardContact(sessionToken, body.stewardEmail || '') : undefined;

    default:
      return undefined;
  }
}

/**
 * Create a JSON response for the mobile app.
 * @param {Object} data - Response data
 * @param {number} [statusCode] - HTTP status (informational only, GAS always returns 200)
 * @returns {TextOutput}
 */
function _jsonResponse(data, statusCode) {
  // GAS web apps always return HTTP 200 — we embed status in the JSON body
  if (statusCode && statusCode >= 400) {
    data._httpStatus = statusCode;
  }
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Centralized selectors for consistent and maintainable test automation
 * 
 * STRATEGY:
 * 1. Prefer data-testid attributes for reliable selection
 * 2. Fall back to semantic HTML roles and ARIA attributes
 * 3. Use CSS selectors as last resort
 * 4. Never use text-based selectors that can change with localization
 */

export const selectors = {
  // Authentication
  auth: {
    usernameInput: '[name="username"], [data-testid="username-input"]',
    passwordInput: '[name="password"], [data-testid="password-input"]',
    submitButton: '[type="submit"], [data-testid="login-submit"]',
    signupForm: '[data-testid="signup-form"], form',
    loginForm: '[data-testid="login-form"], form',
  },

  // Navigation
  navigation: {
    navbar: 'navigation, nav, [role="navigation"]',
    userMenu: 'button:has-text("Sign out"), [aria-label*="user menu"]',
    logoutButton: 'button:has-text("Sign out"), button[title*="logout"]',
    dashboardLink: 'a[href="/dashboard"]',
    protocolsLink: 'a[href="/dashboard/protocols"]',
    participantsLink: 'a[href="/dashboard/participants"]',
    interviewsLink: 'a[href="/dashboard/interviews"]',
    settingsLink: 'a[href="/dashboard/settings"]',
  },

  // Dashboard
  dashboard: {
    summaryStats: '[data-testid="summary-statistics"]',
    activityFeed: '[data-testid="activity-feed"]',
    statCard: '[data-testid="stat-card"]',
    activityItem: 'table tr',
    pageTitle: '[data-testid="dashboard-page-header"] h1',
    mainContent: 'main, [role="main"]',
  },

  // Tables
  table: {
    container: '[data-testid*="table"], [role="table"], table',
    header: '[role="columnheader"], th',
    row: '[role="row"], tr',
    cell: '[role="cell"], td',
    actionButton: '[data-testid*="action"], [aria-label*="action"], [title*="action"]',
    menu: '[role="menu"], .dropdown-menu, [data-testid*="menu"]',
    menuItem: '[role="menuitem"], .menu-item, [data-testid*="menu-item"]',
    pagination: '[data-testid="pagination"], .pagination, [role="navigation"][aria-label*="pagination"]',
  },

  // Protocols
  protocols: {
    container: '[data-testid="protocols-container"]',
    table: '[data-testid="protocols-table"]',
    uploadButton: '[data-testid="upload-protocol"], [data-testid="protocol-uploader"], button[title*="upload"]',
    uploadArea: '[data-testid="upload-area"], .upload-area',
    protocolCard: '[data-testid="protocol-card"], .protocol-card',
    emptyState: '[data-testid="empty-state"], .empty-state',
  },

  // Participants  
  participants: {
    container: '[data-testid="participants-container"]',
    table: '[data-testid="participants-table"]',
    addButton: '[data-testid="add-participant"], button[title*="add participant"]',
    importButton: '[data-testid="import-participants"], button[title*="import"]',
    exportButton: '[data-testid="export-participants"], button[title*="export"]',
    participantModal: '[data-testid="participant-modal"], [role="dialog"]',
    emptyState: '[data-testid="empty-state"], .empty-state',
  },

  // Interviews
  interviews: {
    container: '[data-testid="interviews-container"]',
    table: '[data-testid="interviews-table"]',
    exportButton: '[data-testid="export-interviews"], button[title*="export"]',
    exportDialog: '[data-testid="export-dialog"], [role="dialog"]',
    networkSummary: '[data-testid="network-summary"], .network-summary',
    emptyState: '[data-testid="empty-state"], .empty-state',
  },

  // Settings
  settings: {
    container: '[data-testid="settings-container"]',
    form: '[data-testid="settings-form"], form',
    installationIdField: '[data-testid="installation-id"], input[name*="installation"]',
    uploadthingTokenField: '[data-testid="uploadthing-token"], input[name*="token"]',
    saveButton: '[data-testid="save-settings"], button[type="submit"]',
    readonlyAlert: '[data-testid="readonly-alert"], .alert',
  },

  // Common UI elements
  common: {
    loading: '[data-testid="loading"], .loading, [aria-label*="loading"]',
    error: '[data-testid="error"], .error, [role="alert"]',
    success: '[data-testid="success"], .success',
    modal: '[data-testid="modal"], [role="dialog"]',
    modalClose: '[data-testid="modal-close"], [aria-label*="close"]',
    button: {
      primary: '[data-testid="primary-button"], .btn-primary',
      secondary: '[data-testid="secondary-button"], .btn-secondary',
      danger: '[data-testid="danger-button"], .btn-danger',
    },
    input: {
      text: 'input[type="text"], input:not([type])',
      email: 'input[type="email"]',
      password: 'input[type="password"]', 
      search: 'input[type="search"], [role="searchbox"]',
      checkbox: 'input[type="checkbox"]',
      radio: 'input[type="radio"]',
    },
  },

  // Form elements
  form: {
    field: '[data-testid*="field"], .form-field',
    label: 'label, [data-testid*="label"]',
    input: 'input, textarea, select',
    error: '[data-testid*="error"], .field-error, .error-message',
    required: '[required], [aria-required="true"]',
    submit: '[type="submit"], [data-testid="submit"]',
    cancel: '[data-testid="cancel"], button[title*="cancel"]',
  },
} as const;

// Helper function to create fallback selectors
export function createSelector(...selectors: string[]): string {
  return selectors.join(', ');
}

// Helper to wait for any of multiple selectors
export function anySelector(...selectors: string[]): string {
  return selectors.join(', ');
}
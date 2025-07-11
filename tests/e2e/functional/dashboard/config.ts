/**
 * Configuration for Phase A Dashboard Functional Tests
 */

export const FUNCTIONAL_TEST_CONFIG = {
  // Default timeouts
  timeouts: {
    page: 30000,
    element: 10000,
    navigation: 15000,
    api: 5000,
  },

  // Viewport configurations
  viewports: {
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 },
  },

  // Test data paths
  testDataPaths: {
    participants: {
      csv: 'tests/e2e/test-data/participants/csv',
      json: 'tests/e2e/test-data/participants/json',
      bulk: 'tests/e2e/test-data/participants/bulk',
    },
    files: {
      protocols: 'tests/e2e/test-data/files/protocols',
      assets: 'tests/e2e/test-data/files/assets',
      exports: 'tests/e2e/test-data/files/exports',
      csv: 'tests/e2e/test-data/files/csv',
    },
  },

  // Test selectors (standardized data-testid values)
  selectors: {
    // Navigation
    navigation: '[data-testid="navigation-bar"]',
    logo: '[data-testid="logo"]',
    userMenu: '[data-testid="user-menu"]',

    // Page structure
    pageTitle: '[data-testid="page-title"]',
    pageDescription: '[data-testid="page-description"]',
    mainContent: '[data-testid="main-content"]',

    // Common UI elements
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',

    // Tables
    dataTable: '[data-testid="data-table"]',
    tableRow: '[data-testid="table-row"]',
    tableHeader: '[data-testid="table-header"]',
    searchInput: '[data-testid="search-input"]',

    // Forms
    form: '[data-testid="form"]',
    formInput: '[data-testid="form-input"]',
    formSubmit: '[data-testid="form-submit"]',
    formError: '[data-testid="form-error"]',

    // Modals
    modal: '[data-testid="modal"]',
    modalTitle: '[data-testid="modal-title"]',
    modalContent: '[data-testid="modal-content"]',
    modalClose: '[data-testid="modal-close"]',

    // Buttons
    addButton: '[data-testid="add-button"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',
  },

  // Test scenarios
  scenarios: {
    // Navigation scenarios
    navigation: {
      dashboardOverview: '/dashboard',
      participants: '/dashboard/participants',
      protocols: '/dashboard/protocols',
      interviews: '/dashboard/interviews',
      settings: '/dashboard/settings',
    },

    // Form scenarios
    forms: {
      createParticipant: {
        validData: {
          identifier: 'TEST001',
          name: 'Test Participant',
          email: 'test@example.com',
          notes: 'Test notes',
        },
        invalidData: {
          identifier: '',
          name: '',
          email: 'invalid-email',
          notes: '',
        },
      },
    },

    // Search scenarios
    search: {
      validQueries: ['test', 'participant', 'protocol'],
      invalidQueries: ['xyz123', '!@#$%'],
      emptyQuery: '',
    },
  },

  // Retry configurations
  retries: {
    default: 2,
    network: 3,
    auth: 1,
    visual: 1,
  },

  // Performance thresholds
  performance: {
    pageLoad: 5000,
    apiResponse: 2000,
    tableRender: 3000,
    formSubmit: 3000,
  },

  // Error handling
  errors: {
    expectedErrors: ['NetworkError', 'TimeoutError', 'ValidationError'],
    ignoredErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-passive event listener',
    ],
  },
} as const;

export type FunctionalTestConfig = typeof FUNCTIONAL_TEST_CONFIG;

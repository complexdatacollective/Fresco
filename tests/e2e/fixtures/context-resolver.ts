import type { TestInfo } from '@playwright/test';
import type { TestEnvironmentContext } from './test-environment';

/**
 * Context resolver that determines the appropriate test environment context
 * based on the current test's location and configuration
 */
export class ContextResolver {
  /**
   * Resolve the appropriate test environment context for the current test
   */
  static resolveContext(testInfo?: TestInfo): TestEnvironmentContext | null {
    // Method 1: Try to infer from test file path
    const contextFromPath = this.inferContextFromTestPath(testInfo);
    if (contextFromPath) {
      return contextFromPath;
    }

    // Method 2: Try to infer from Playwright project name
    const contextFromProject = this.inferContextFromProject(testInfo);
    if (contextFromProject) {
      return contextFromProject;
    }

    // Method 3: Try to infer from base URL
    const contextFromBaseURL = this.inferContextFromBaseURL(testInfo);
    if (contextFromBaseURL) {
      return contextFromBaseURL;
    }

    // Method 4: Fall back to interviews context (most feature-rich)
    return globalThis.__INTERVIEWS_CONTEXT__ ?? null;
  }

  /**
   * Infer context from test file path
   * e.g., /suites/dashboard/participants.spec.ts -> dashboard context
   */
  private static inferContextFromTestPath(
    testInfo?: TestInfo,
  ): TestEnvironmentContext | null {
    if (!testInfo?.file) {
      return null;
    }

    // Extract suite name from file path
    const pathParts = testInfo.file.split('/');
    const suitesIndex = pathParts.findIndex((part) => part === 'suites');

    if (suitesIndex >= 0 && pathParts.length > suitesIndex + 1) {
      const suiteName = pathParts[suitesIndex + 1];

      // Map suite directory names to global contexts
      const suiteToContextMap: Record<
        string,
        TestEnvironmentContext | undefined
      > = {
        setup: globalThis.__SETUP_CONTEXT__,
        dashboard: globalThis.__DASHBOARD_CONTEXT__,
        interview: globalThis.__INTERVIEWS_CONTEXT__, // Note: interviews vs interview
        auth: globalThis.__DASHBOARD_CONTEXT__, // Auth tests typically use dashboard context
      };

      return suiteToContextMap[suiteName] ?? null;
    }

    return null;
  }

  /**
   * Infer context from Playwright project name
   */
  private static inferContextFromProject(
    testInfo?: TestInfo,
  ): TestEnvironmentContext | null {
    if (!testInfo?.project?.name) {
      return null;
    }

    // Map project names to global contexts
    const projectToContextMap: Record<
      string,
      TestEnvironmentContext | undefined
    > = {
      'setup': globalThis.__SETUP_CONTEXT__,
      'auth-dashboard': globalThis.__DASHBOARD_CONTEXT__,
      'dashboard': globalThis.__DASHBOARD_CONTEXT__,
      'interview': globalThis.__INTERVIEWS_CONTEXT__,
    };

    return projectToContextMap[testInfo.project.name] ?? null;
  }

  /**
   * Infer context from base URL
   */
  private static inferContextFromBaseURL(
    testInfo?: TestInfo,
  ): TestEnvironmentContext | null {
    const baseURL = testInfo?.project?.use?.baseURL as string | undefined;
    if (!baseURL) {
      return null;
    }

    // Check which context has the matching app URL
    const contexts = [
      globalThis.__SETUP_CONTEXT__,
      globalThis.__DASHBOARD_CONTEXT__,
      globalThis.__INTERVIEWS_CONTEXT__,
    ].filter(Boolean) as TestEnvironmentContext[];

    for (const context of contexts) {
      if (context.appUrl === baseURL) {
        return context;
      }
    }

    return null;
  }

  /**
   * Get a list of available contexts for debugging
   */
  static getAvailableContexts(): string[] {
    const contexts = [];
    if (globalThis.__SETUP_CONTEXT__) contexts.push('setup');
    if (globalThis.__DASHBOARD_CONTEXT__) contexts.push('dashboard');
    if (globalThis.__INTERVIEWS_CONTEXT__) contexts.push('interviews');
    return contexts;
  }

  /**
   * Get context information for debugging
   */
  static getContextInfo(testInfo?: TestInfo): {
    resolvedContext: string | null;
    availableContexts: string[];
    detectionMethod: string;
    testFile?: string;
    projectName?: string;
    baseURL?: string;
  } {
    const availableContexts = this.getAvailableContexts();

    if (availableContexts.length === 0) {
      return {
        resolvedContext: null,
        availableContexts: [],
        detectionMethod: 'No test environment available',
        testFile: testInfo?.file,
        projectName: testInfo?.project?.name,
        baseURL: testInfo?.project?.use?.baseURL as string | undefined,
      };
    }

    // Try each detection method and report which one worked
    const pathContext = this.inferContextFromTestPath(testInfo);
    if (pathContext) {
      return {
        resolvedContext: this.getContextId(pathContext),
        availableContexts,
        detectionMethod: 'test file path',
        testFile: testInfo?.file,
        projectName: testInfo?.project?.name,
        baseURL: testInfo?.project?.use?.baseURL as string | undefined,
      };
    }

    const projectContext = this.inferContextFromProject(testInfo);
    if (projectContext) {
      return {
        resolvedContext: this.getContextId(projectContext),
        availableContexts,
        detectionMethod: 'Playwright project name',
        testFile: testInfo?.file,
        projectName: testInfo?.project?.name,
        baseURL: testInfo?.project?.use?.baseURL as string | undefined,
      };
    }

    const urlContext = this.inferContextFromBaseURL(testInfo);
    if (urlContext) {
      return {
        resolvedContext: this.getContextId(urlContext),
        availableContexts,
        detectionMethod: 'base URL matching',
        testFile: testInfo?.file,
        projectName: testInfo?.project?.name,
        baseURL: testInfo?.project?.use?.baseURL as string | undefined,
      };
    }

    return {
      resolvedContext: globalThis.__INTERVIEWS_CONTEXT__ ? 'interviews' : null,
      availableContexts,
      detectionMethod: 'fallback to interviews',
      testFile: testInfo?.file,
      projectName: testInfo?.project?.name,
      baseURL: testInfo?.project?.use?.baseURL as string | undefined,
    };
  }

  /**
   * Helper to get context ID from context object
   */
  private static getContextId(context: TestEnvironmentContext): string | null {
    if (context === globalThis.__SETUP_CONTEXT__) return 'setup';
    if (context === globalThis.__DASHBOARD_CONTEXT__) return 'dashboard';
    if (context === globalThis.__INTERVIEWS_CONTEXT__) return 'interviews';
    return null;
  }
}

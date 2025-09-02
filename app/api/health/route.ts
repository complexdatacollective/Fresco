import { type NextRequest, NextResponse } from 'next/server';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

type HealthCheck = {
  name: string;
  status: HealthStatus;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
};

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version?: string;
  checks: HealthCheck[];
};

async function checkBasicHealth(): Promise<HealthCheck> {
  const start = performance.now();
  
  try {
    // Basic health check - just verify the service is running
    const nodeVersion = process.version;
    const duration = performance.now() - start;
    
    return {
      name: 'basic',
      status: 'healthy',
      duration: Math.round(duration),
      details: {
        nodeVersion,
        environment: process.env.NODE_ENV,
        uptime: Math.round(process.uptime()),
      },
    };
  } catch (error) {
    const duration = performance.now() - start;
    
    return {
      name: 'basic',
      status: 'unhealthy',
      duration: Math.round(duration),
      error: error instanceof Error ? error.message : 'Basic health check failed',
    };
  }
}

function getOverallStatus(checks: HealthCheck[]): HealthStatus {
  const hasUnhealthy = checks.some((check) => check.status === 'unhealthy');
  const hasDegraded = checks.some((check) => check.status === 'degraded');
  
  if (hasUnhealthy) return 'unhealthy';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

function getStatusCode(status: HealthStatus): number {
  switch (status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200; // Still operational
    case 'unhealthy':
      return 503; // Service Unavailable
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  
  try {
    // Run health checks
    const basicCheck = await checkBasicHealth();
    const checks = [basicCheck];
    
    const overallStatus = getOverallStatus(checks);
    const statusCode = getStatusCode(overallStatus);
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version || 'unknown',
      checks,
    };
    
    const totalDuration = Math.round(performance.now() - startTime);
    
    return NextResponse.json(
      {
        ...response,
        duration: totalDuration,
      },
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'true',
        },
      },
    );
  } catch (error) {
    // Fallback error response
    const response: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: [
        {
          name: 'health_check',
          status: 'unhealthy',
          duration: Math.round(performance.now() - startTime),
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      ],
    };
    
    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
      },
    });
  }
}
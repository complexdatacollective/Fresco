'use client';

import React, { type ReactNode } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { logOfflineError, offlineDb } from '~/lib/offline/db';
import { ensureError } from '~/utils/ensureError';

type OfflineErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type OfflineErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class OfflineErrorBoundary extends React.Component<
  OfflineErrorBoundaryProps,
  OfflineErrorBoundaryState
> {
  constructor(props: OfflineErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): OfflineErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const err = ensureError(error);
    void logOfflineError('OfflineErrorBoundary', err, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleClearCache = async (): Promise<void> => {
    try {
      await offlineDb.delete();
      window.location.reload();
    } catch (error) {
      const err = ensureError(error);
      // eslint-disable-next-line no-console
      console.error('Failed to clear cache:', err);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Surface className="mx-auto my-8 max-w-2xl" spacing="lg">
          <div className="space-y-6">
            <div>
              <Heading level="h2">Offline Feature Error</Heading>
              <Paragraph className="mt-2">
                An error occurred with the offline features. Your interview data
                is safe, but you may need to refresh the page.
              </Paragraph>
            </div>

            <Alert variant="destructive">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                {this.state.error?.message ?? 'Unknown error occurred'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={this.handleReset}>Try Again</Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                color="destructive"
                onClick={this.handleClearCache}
              >
                Clear Cache
              </Button>
            </div>
          </div>
        </Surface>
      );
    }

    return this.props.children;
  }
}

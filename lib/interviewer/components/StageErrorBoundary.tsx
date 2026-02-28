import posthog from 'posthog-js';
import React, { Component, type ReactNode } from 'react';
import CopyDebugInfoButton from '~/components/CopyDebugInfoButton';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Icon from '~/components/ui/Icon';

type StageErrorBoundaryProps = {
  children: ReactNode;
};

type StageErrorBoundaryState = {
  error?: Error;
};

class StageErrorBoundary extends Component<
  StageErrorBoundaryProps,
  StageErrorBoundaryState
> {
  constructor(props: StageErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    posthog.captureException(error, {
      componentStack: info.componentStack,
    });
    this.setState({ error });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <Surface noContainer className="mx-auto h-fit max-w-2xl grow-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center">
              <Icon name="error" />
            </div>
            <div>
              <Heading>A problem occurred!</Heading>
              <Paragraph>
                There was an error with the interview software, and this task
                could not be displayed. Try refreshing the page. If the problem
                persists, please contact the study organizer and provide the
                debug information below. You may be able to continue your
                interview by clicking the next button.
              </Paragraph>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <CopyDebugInfoButton debugInfo={error.stack ?? error.message} />
          </div>
        </Surface>
      );
    }

    return children;
  }
}

export default StageErrorBoundary;

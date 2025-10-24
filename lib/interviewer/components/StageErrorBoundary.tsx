import React, { Component, type ReactNode } from 'react';
import { ErrorDetails } from '~/components/ErrorDetails';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import trackEvent from '~/lib/analytics';
import Icon from '~/lib/ui/components/Icon';

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
    void trackEvent({
      name: 'Stage Error',
      type: 'Error',
      message: error.message,
      stack: error.stack + '\n' + info.componentStack,
    });
    this.setState({ error });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <div className="interface">
          <Surface className="max-w-2xl">
            <div className="flex items-center justify-center">
              <Icon name="error" />
            </div>
            <Heading>A problem occurred!</Heading>
            <Paragraph>
              There was an error with the interview software, and this task
              could not be displayed. Try refreshing the page. If the problem
              persists, please contact the study organizer and provide the debug
              information below. You may be able to continue your interview by
              clicking the next button.
            </Paragraph>
            <ErrorDetails errorText={error.message}>{error.stack}</ErrorDetails>
          </Surface>
        </div>
      );
    }

    return children;
  }
}

export default StageErrorBoundary;

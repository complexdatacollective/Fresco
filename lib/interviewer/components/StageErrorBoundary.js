import PropTypes from 'prop-types';
import { Component } from 'react';
import Icon from '~/lib/ui/components/Icon';

class StageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;
    if (error) {
      return (
        <div className="allow-text-selection flex w-full flex-col items-center justify-center">
          <div className="flex max-w-3xl flex-col items-center justify-center space-y-4">
            <Icon name="error" />
            <h1>Sorry – we encountered a problem.</h1>
            <p className="text-center text-xl">
              An error occured which prevented this section of the interview
              from loading. Please contact the study organizer for help.
            </p>
            <div className="border-destructive rounded-lg border p-6">
              <h4 className="mb-2">Error details:</h4>
              <code>{error.message}</code>
            </div>
          </div>
        </div>
      );
    }
    return children;
  }
}

StageErrorBoundary.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string,
  ]),
};

export default StageErrorBoundary;

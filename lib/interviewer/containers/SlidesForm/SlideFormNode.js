import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { withProps } from 'recompose';
import { Form } from '~/lib/form';
import Scroller from '~/lib/ui/components/Scroller';
import Node from '../../components/Node';

class SlideFormNode extends PureComponent {
  handleSubmit = (formData) => {
    const { id, onUpdate } = this.props;
    onUpdate?.({ nodeId: id, newAttributeData: formData });
  };

  render() {
    const {
      form = {},
      item,
      initialValues,
      subject,
      submitButton = (
        <button type="submit" key="submit" aria-label="Submit" hidden />
      ),
      id,
      otherNetworkEntities,
      onScroll,
    } = this.props;

    return (
      <div className="swiper-slide">
        <div className="slide-content">
          <Node {...item} />
          <div className="alter-form__form-container">
            <Scroller onScroll={onScroll?.()}>
              <Form
                {...form}
                className="alter-form__form"
                initialValues={initialValues}
                autoFocus={false}
                subject={subject}
                onSubmit={this.handleSubmit}
                submitButton={submitButton}
                validationMeta={{ entityId: id }}
                otherNetworkEntities={otherNetworkEntities}
              />
            </Scroller>
          </div>
        </div>
      </div>
    );
  }
}

SlideFormNode.propTypes = {
  form: PropTypes.object,
  subject: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  onScroll: PropTypes.func,
  submitButton: PropTypes.object,
};

const withNodeProps = withProps(({ item }) => ({
  id: item?.[entityPrimaryKeyProperty],
  initialValues: item?.[entityAttributesProperty],
}));

export default withNodeProps(SlideFormNode);

import ActionButton from './ActionButton';
import colors from '@/components/StorybookHelpers/Colors';

const iconOptions = [
  'add-a-person',
  'add-a-place',
  'add-a-relationship',
  'add-a-context',
  'add-a-protocol',
];

export default {
  title: 'Components/ActionButton',
  args: {
    disabled: false,
    icon: 'Business',
    color: 'sea-green',
    title: 'Add',
  },
  argTypes: {
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    icon: {
      control: {
        type: 'select',
      },
      options: iconOptions,
    },
    color: {
      control: {
        type: 'select',
      },
      options: colors,
    },
    title: {
      control: {
        type: 'text',
      },
    },
    onClick: { action: 'onClick' },
  },
};

// Template.propTypes = {
//   disabled: PropTypes.bool,
//   icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
//   onClick: PropTypes.func,
//   color: PropTypes.string,
//   title: PropTypes.string,
// };

// Template.defaultProps = {
//   disabled: false,
//   icon: null,
//   onClick: noop,
//   color: '',
//   title: 'Add',
// };

export const Normal = {
  render: ({ disabled, icon, onClick, color, title }) => (
    <>
      <ActionButton disabled={disabled} icon={icon} onClick={onClick} color={color} title={title} />
      Next element
    </>
  ),
};

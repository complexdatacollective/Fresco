import type { Meta, StoryObj } from '@storybook/react';
import Spinner from '@/components/Spinner/Spinner';
import Button from '@/components/Button/Button';
import colors from '@/components/StorybookHelpers/Colors';
import * as icons from '@/icons';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: {
        type: 'select',
      },
      options: colors,
    },
    icon: {
      control: {
        type: 'select',
      },
      options: Object.keys(icons.default),
    },
    iconPosition: {
      control: {
        type: 'select',
      },
      options: ['left', 'right'],
    },
    size: {
      control: {
        type: 'radio',
      },
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    children: {
      control: {
        type: 'text',
      },
    },
    onClick: { action: 'onClick' },
    fullWidth: {
      control: {
        type: 'boolean',
      },
    },
  }
};


export default meta;
type Story = StoryObj<typeof Button>;

export const Basic: Story = {
  args: {
    children: 'Button',
    size: 'medium',
    disabled: false,
    fullWidth: false,
    color: 'sea-green',
    type: 'button',
  },
};

// export const basic = () => (
//   <Harness requiredProps={requiredProps}>{(props) => <Button {...props} />}</Harness>
// );

// export const withIcon = () => (
//   <Harness requiredProps={requiredProps} icon="arrow-left">
//     {(props) => <Button {...props} />}
//   </Harness>
// );

// export const withIconRight = () => (
//   <Harness requiredProps={requiredProps} iconPosition="right" icon="arrow-right">
//     {(props) => <Button {...props} />}
//   </Harness>
// );

// export const colorVariants = () => {
//   return colors.map((color) => (
//     <Harness requiredProps={requiredProps} color={color}>
//       {(props) => <Button {...props} />}
//     </Harness>
//   ));
// };

// export const iconVariants = () => {
//   return Object.keys(icons.default).map((icon) => (
//     <Harness requiredProps={requiredProps} icon={icon}>
//       {(props) => <Button {...props}> {icon}</Button>}
//     </Harness>
//   ));
// };

// export const customIcon = () => (
//   <Harness
//     requiredProps={requiredProps}
//     color="platinum"
//     iconPosition="right"
//     icon={
//       <div>
//         <Spinner size="0.5rem" />
//       </div>
//     }
//   >
//     {(props) => <Button {...props} />}
//   </Harness>
// );

// export const sizes = () => (
//   <Harness requiredProps={requiredProps}>
//     {(props) => (
//       <p>
//         <Button {...props} size="small">
//           Smol button
//         </Button>
//         <br /><br />
//         <Button {...props}>Standard Button</Button>
//         <br /><br />
//         <Button {...props} size="large">Humongous Chungus</Button>
//       </p>
//     )}
//   </Harness>
// );

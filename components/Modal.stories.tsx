import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import ModalPopup, { ModalPopupAnimation } from '~/lib/dialogs/ModalPopup';
import { cx } from '~/utils/cva';
import Modal from './Modal';
import Button from './ui/Button';

const meta: Meta<typeof Modal> = {
  title: 'Systems/Modal',
  component: Modal,
  args: {
    onOpenChange: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A reusable modal overlay component that portals content and handles accessibility. Used as the foundation for Dialog, Sheet, and other overlay components. All children must use ModalPopup (BaseDialog.Popup) for proper accessibility and animation support.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

function InteractiveModal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          key="modal-popup"
          className={cx(
            'fixed top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2',
            'bg-surface-1 text-surface-1-contrast rounded-lg p-6 shadow-xl',
          )}
          {...ModalPopupAnimation}
        >
          <h2 className="mb-2 text-lg font-semibold">Modal Title</h2>
          <p className="mb-4 text-current/70">
            This is a basic modal using the Modal component that uses the
            built-in animation for ModalPopup. Click outside or press Escape to
            close.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveModal />,
};

function SheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Open Sheet</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          key="sheet-popup"
          className={cx(
            'fixed top-0 right-0 h-full w-96',
            'bg-surface-1 text-surface-1-contrast shadow-xl',
          )}
          initial={{ x: '100%', opacity: 0.99 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.99 }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <div className="flex h-full flex-col p-6">
            <h2 className="mb-2 text-lg font-semibold">Sheet Panel</h2>
            <p className="mb-4 flex-1 text-current/70">
              This demonstrates using Modal for a side sheet/drawer pattern. The
              Modal component handles the backdrop and portal, while custom
              content provides the slide-in animation.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const AsSheet: Story = {
  render: () => <SheetExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Modal can be used to create sheet/drawer patterns by customizing the popup positioning and animation.',
      },
    },
  },
};

function BottomSheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          key="bottom-sheet-popup"
          className={cx(
            'fixed right-0 bottom-0 left-0',
            'bg-surface-1 text-surface-1-contrast rounded-t-xl shadow-xl',
          )}
          initial={{ y: '100%', opacity: 0.99 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.99 }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <div className="p-6">
            <h2 className="mb-2 text-lg font-semibold">Bottom Sheet</h2>
            <p className="mb-4 text-current/70">
              A mobile-friendly bottom sheet pattern using the Modal component.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const AsBottomSheet: Story = {
  render: () => <BottomSheetExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Modal can be configured as a bottom sheet for mobile-friendly interfaces.',
      },
    },
  },
};

function FullscreenOverlayExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Open Fullscreen</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          key="fullscreen-popup"
          className={cx(
            'fixed inset-0',
            'bg-surface-1 text-surface-1-contrast',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fullscreen Overlay</h2>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
            <p className="mt-4 flex-1 text-current/70">
              This demonstrates a fullscreen overlay pattern. Useful for
              immersive experiences, image galleries, or complex forms.
            </p>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const AsFullscreen: Story = {
  render: () => <FullscreenOverlayExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Modal can be used for fullscreen overlays when maximum screen real estate is needed.',
      },
    },
  },
};

function NestedModalsExample() {
  const [outerOpen, setOuterOpen] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOuterOpen(true)}>Open First Modal</Button>
      <Modal open={outerOpen} onOpenChange={setOuterOpen}>
        <ModalPopup
          key="outer-modal-popup"
          className={cx(
            'fixed top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2',
            'bg-surface-1 text-surface-1-contrast rounded-lg p-6 shadow-xl',
          )}
          {...ModalPopupAnimation}
        >
          <h2 className="mb-2 text-lg font-semibold">First Modal</h2>
          <p className="mb-4 text-current/70">
            This is the outer modal. You can open another modal on top of it.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOuterOpen(false)}>Close</Button>
            <Button color="primary" onClick={() => setInnerOpen(true)}>
              Open Second Modal
            </Button>
          </div>
        </ModalPopup>
      </Modal>
      <Modal open={innerOpen} onOpenChange={setInnerOpen}>
        <ModalPopup
          key="inner-modal-popup"
          className={cx(
            'fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2',
            'bg-surface-1 text-surface-1-contrast rounded-lg p-6 shadow-xl',
          )}
          {...ModalPopupAnimation}
        >
          <h2 className="mb-2 text-lg font-semibold">Second Modal</h2>
          <p className="mb-4 text-current/70">
            This is a nested modal on top of the first one.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setInnerOpen(false)}>Close</Button>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const NestedModals: Story = {
  render: () => <NestedModalsExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Multiple Modal instances can be stacked for confirmation dialogs or multi-step flows.',
      },
    },
  },
};

function CustomAnimationExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Open Bouncy Modal</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          key="bouncy-modal-popup"
          className={cx(
            'fixed top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2',
            'bg-surface-1 text-surface-1-contrast rounded-lg p-6 shadow-xl',
          )}
          initial={{ opacity: 0, scale: 0.3, y: -100 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.3,
            y: 100,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15,
          }}
        >
          <h2 className="mb-2 text-lg font-semibold">Custom Animation</h2>
          <p className="mb-4 text-current/70">
            This modal uses a custom bouncy spring animation. You can override
            the default animation by passing different motion props.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </ModalPopup>
      </Modal>
    </div>
  );
}

export const CustomAnimation: Story = {
  render: () => <CustomAnimationExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Override the default animation by passing custom motion props (initial, animate, exit, transition).',
      },
    },
  },
};

// layoutId morph transition example
const items = [
  {
    id: 'item-1',
    title: 'Project Alpha',
    description: 'A cutting-edge web application',
    color: 'blue',
  },
  {
    id: 'item-2',
    title: 'Project Beta',
    description: 'Mobile-first design system',
    color: 'green',
  },
  {
    id: 'item-3',
    title: 'Project Gamma',
    description: 'AI-powered analytics platform',
    color: 'purple',
  },
];

function LayoutIdMorphExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <motion.button
            key={item.id}
            layoutId={item.id}
            onClick={() => setSelectedId(item.id)}
            className={cx(
              'bg-surface-1 text-surface-1-contrast cursor-pointer p-4 text-left',
            )}
            style={{
              borderRadius: 28,
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            }}
            whileHover={{
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              scale: 1.03,
            }}
          >
            <motion.div
              layoutId={`${item.id}-image`}
              className={cx(
                'mb-3 h-24 w-full',
                item.color === 'blue' && 'bg-cerulean-blue',
                item.color === 'green' && 'bg-kiwi',
                item.color === 'purple' && 'bg-slate-blue',
              )}
              style={{ borderRadius: 14 }}
            />
            <motion.h3 layoutId={`${item.id}-title`} className="font-semibold">
              {item.title}
            </motion.h3>
            <motion.p
              layoutId={`${item.id}-description`}
              className="text-sm text-current/70"
            >
              {item.description}
            </motion.p>
          </motion.button>
        ))}
      </div>

      <Modal
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        {selectedItem && (
          <ModalPopup
            key="dialog-popup"
            layoutId={selectedItem.id}
            className={cx(
              'fixed top-1/2 left-1/2 w-[500px] -translate-x-1/2 -translate-y-1/2',
              'bg-surface-1 text-surface-1-contrast p-6',
            )}
            style={{ borderRadius: 42 }}
          >
            <motion.div
              layoutId={`${selectedItem.id}-image`}
              className={cx(
                'mb-4 h-48 w-full',
                selectedItem.color === 'blue' && 'bg-cerulean-blue',
                selectedItem.color === 'green' && 'bg-kiwi',
                selectedItem.color === 'purple' && 'bg-slate-blue',
              )}
              style={{
                borderRadius: 28,
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              }}
            />
            <motion.h2
              layoutId={`${selectedItem.id}-title`}
              className="mb-2 text-xl font-semibold"
            >
              {selectedItem.title}
            </motion.h2>
            <motion.p
              layoutId={`${selectedItem.id}-description`}
              className="mb-4 text-current/70"
            >
              {selectedItem.description}
            </motion.p>
            <motion.p className="mb-4 text-current/70">
              Click outside or press Escape to close and see the morph
              transition back to the card.
            </motion.p>
            <motion.div className="flex justify-end">
              <Button onClick={() => setSelectedId(null)}>Close</Button>
            </motion.div>
          </ModalPopup>
        )}
      </Modal>
    </div>
  );
}

export const LayoutIdMorph: Story = {
  render: () => <LayoutIdMorphExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Use layoutId to create smooth morph transitions between a trigger element and the modal. The modal appears to expand from the clicked card and collapses back when closed.',
      },
    },
  },
};

import Dialog from '~/lib/dialogs/Dialog';

type OverlayProps = {
  children: React.ReactNode;
  onClose: () => void;
  show: boolean;
  title: string;
  footer?: React.ReactNode;
  className?: string;
};

const Overlay = (props: OverlayProps) => {
  const { children, onClose, show, title, footer, className } = props;

  return (
    <Dialog
      open={show}
      closeDialog={onClose}
      title={title}
      className={className}
      footer={footer}
    >
      {children}
    </Dialog>
  );
};

export default Overlay;

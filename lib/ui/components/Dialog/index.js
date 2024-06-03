import ConfirmDialog from './Confirm';
import Dialog from './Dialog';
import ErrorDialog from './Error';
import NoticeDialog from './Notice';
import UserErrorDialog from './UserError';
import WarningDialog from './Warning';

const DialogVariants = {
  Dialog: Dialog,
  Error: ErrorDialog,
  UserError: UserErrorDialog,
  Warning: WarningDialog,
  Confirm: ConfirmDialog,
  Notice: NoticeDialog,
};

export default DialogVariants;

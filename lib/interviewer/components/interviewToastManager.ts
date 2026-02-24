import { Toast } from '@base-ui/react/toast';

/**
 * Global toast manager for interview validation/notification toasts.
 *
 * Anchored interview toasts need their own Toast.Provider rendered as a
 * **sibling** of the app-level stacked toast provider (not nested). This
 * manager is passed to that sibling provider via the `toastManager` prop, and
 * can be called from anywhere (hooks, event handlers) to add/close toasts.
 *
 * @see https://base-ui.com/react/components/toast#anchored-toasts
 */
export const interviewToastManager = Toast.createToastManager();

'use client';

import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { Plus, Trash, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useState } from 'react';
import { z } from 'zod/mini';

import { commonMessages } from '@codaco/app-i18n/common';
import type { IntlShape } from '@codaco/app-i18n/messages';
import { createMessageError, defineMessages } from '@codaco/app-i18n/messages';
import {
  AppErrorMessage,
  AppMessage,
  useAppIntl,
} from '@codaco/app-i18n/react';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { DataTable } from '@codaco/fresco-ui/DataTable/DataTable';
import { DataTableFloatingBar } from '@codaco/fresco-ui/DataTable/DataTableFloatingBar';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import Field from '@codaco/fresco-ui/form/Field/Field';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import PasswordField from '@codaco/fresco-ui/form/fields/PasswordField';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import { type FormSubmissionResult } from '@codaco/fresco-ui/form/store/types';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import {
  changePassword,
  checkUsernameAvailable,
  createUser,
  deleteUsers,
} from '~/actions/users';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  resetAuthForUser,
  switchToPasskeyMode,
  switchToPasswordMode,
  verifyPasskeyReauth,
} from '~/actions/webauthn';
import PasskeySettings from '~/app/dashboard/settings/_components/PasskeySettings';
import TwoFactorSettings from '~/app/dashboard/settings/_components/TwoFactorSettings';
import FormDialog from '~/components/FormDialog';
import SettingsField from '~/components/settings/SettingsField';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import { describePasskeyCeremonyError } from '~/i18n/passkeyCeremony';
import { type GetUsersReturnType } from '~/queries/users';
import {
  getPasswordRules,
  passwordMessages,
  PASSWORD_MIN_LENGTH,
} from '~/utils/isStrongPassword';

const messages = defineMessages({
  deleteCount: {
    id: 'fresco.settings.UserManagement.deleteCount',
    defaultMessage:
      '{count, plural, one {Delete # user} other {Delete # users}}',
    description:
      'Researcher-facing settings.UserManagement: count, plural, one Delete # user other Delete # users',
  },

  passwordAuth: {
    id: 'fresco.settings.users.passwordAuth',
    defaultMessage: 'Password',
    description: 'Researcher-facing settings.users: Password',
  },

  passwordTwoFactor: {
    id: 'fresco.settings.users.passwordTwoFactor',
    defaultMessage: 'Password + 2FA',
    description: 'Researcher-facing settings.users: Password + 2FA',
  },

  passkeyAuth: {
    id: 'fresco.settings.users.passkeyAuth',
    defaultMessage: 'Passkey',
    description: 'Researcher-facing settings.users: Passkey',
  },

  usernameTaken: {
    id: 'fresco.settings.users.usernameTaken',
    defaultMessage: 'Username is already taken',
    description: 'Researcher-facing settings.users: Username is already taken',
  },

  usernameSpaces: {
    id: 'fresco.settings.users.usernameSpaces',
    defaultMessage: 'Username cannot contain spaces',
    description:
      'Researcher-facing settings.users: Username cannot contain spaces',
  },

  usernameMinimum: {
    id: 'fresco.settings.users.usernameMinimum',
    defaultMessage: 'Username must be at least 4 characters',
    description:
      'Researcher-facing settings.users: Username must be at least 4 characters',
  },

  copyYouCannotDeleteYourOwnAccount: {
    id: 'fresco.settings.UserManagement.copyYouCannotDeleteYourOwnAccount',
    defaultMessage: 'You cannot delete your own account',
    description:
      'Researcher-facing settings / UserManagement: You cannot delete your own account',
  },
  copyDeleteUser: {
    id: 'fresco.settings.UserManagement.copyDeleteUser',
    defaultMessage: 'Delete User',
    description: 'Researcher-facing settings / UserManagement: Delete User',
  },
  copyDeleteMultipleUsers: {
    id: 'fresco.settings.UserManagement.copyDeleteMultipleUsers',
    defaultMessage: 'Delete Multiple Users',
    description:
      'Researcher-facing settings / UserManagement: Delete Multiple Users',
  },
  copyAreYouSureYouWantToDelete: {
    id: 'fresco.settings.UserManagement.copyAreYouSureYouWantToDelete',
    defaultMessage:
      'Are you sure you want to delete the user "{value1}"? This action cannot be undone.',
    description:
      'Researcher-facing settings / UserManagement: Are you sure you want to delete the user "value"? This action cannot be undone.',
  },
  copyAreYouSureYouWantToDelete2: {
    id: 'fresco.settings.UserManagement.copyAreYouSureYouWantToDelete2',
    defaultMessage:
      'Are you sure you want to delete {value1, plural, one {# user} other {# users}}? This action cannot be undone.',
    description:
      'Researcher-facing settings / UserManagement: Are you sure you want to delete value users? This action cannot be undone.',
  },
  copyPasswordsDoNotMatch: {
    id: 'fresco.settings.UserManagement.copyPasswordsDoNotMatch',
    defaultMessage: 'Passwords do not match',
    description:
      'Researcher-facing settings / UserManagement: Passwords do not match',
  },
  copyNewPasswordsDoNotMatch: {
    id: 'fresco.settings.UserManagement.copyNewPasswordsDoNotMatch',
    defaultMessage: 'New passwords do not match',
    description:
      'Researcher-facing settings / UserManagement: New passwords do not match',
  },
  copyFailedToStartRegistration: {
    id: 'fresco.settings.UserManagement.copyFailedToStartRegistration',
    defaultMessage: 'Failed to start registration',
    description:
      'Researcher-facing settings / UserManagement: Failed to start registration',
  },
  copyPasskeyCreationFailed: {
    id: 'fresco.settings.UserManagement.copyPasskeyCreationFailed',
    defaultMessage: 'Passkey creation failed.',
    description:
      'Researcher-facing settings / UserManagement: Passkey creation failed.',
  },
  copyFailedToStartVerification: {
    id: 'fresco.settings.UserManagement.copyFailedToStartVerification',
    defaultMessage: 'Failed to start verification',
    description:
      'Researcher-facing settings / UserManagement: Failed to start verification',
  },
  copyVerificationFailed: {
    id: 'fresco.settings.UserManagement.copyVerificationFailed',
    defaultMessage: 'Verification failed',
    description:
      'Researcher-facing settings / UserManagement: Verification failed',
  },
  copyVerifying: {
    id: 'fresco.settings.UserManagement.copyVerifying',
    defaultMessage: 'Verifying...',
    description: 'Researcher-facing settings / UserManagement: Verifying...',
  },
  copyVerifyWithPasskey: {
    id: 'fresco.settings.UserManagement.copyVerifyWithPasskey',
    defaultMessage: 'Verify with passkey',
    description:
      'Researcher-facing settings / UserManagement: Verify with passkey',
  },
  selectAll: {
    id: 'fresco.settings.UserManagement.selectAll',
    defaultMessage: 'Select all',
    description: 'Researcher-facing settings / UserManagement: Select all',
  },
  selectRow: {
    id: 'fresco.settings.UserManagement.selectRow',
    defaultMessage: 'Select row',
    description: 'Researcher-facing settings / UserManagement: Select row',
  },
  username: {
    id: 'fresco.settings.UserManagement.username',
    defaultMessage: 'Username',
    description: 'Researcher-facing settings / UserManagement: Username',
  },
  you: {
    id: 'fresco.settings.UserManagement.you',
    defaultMessage: '(you)',
    description: 'Researcher-facing settings / UserManagement: (you)',
  },
  authMethod: {
    id: 'fresco.settings.UserManagement.authMethod',
    defaultMessage: 'Auth Method',
    description: 'Researcher-facing settings / UserManagement: Auth Method',
  },
  actions: {
    id: 'fresco.settings.UserManagement.actions',
    defaultMessage: 'Actions',
    description: 'Researcher-facing settings / UserManagement: Actions',
  },
  resetAuth: {
    id: 'fresco.settings.UserManagement.resetAuth',
    defaultMessage: 'Reset Auth',
    description: 'Researcher-facing settings / UserManagement: Reset Auth',
  },
  deleteUser: {
    id: 'fresco.settings.UserManagement.deleteUser',
    defaultMessage: 'Delete User',
    description: 'Researcher-facing settings / UserManagement: Delete User',
  },
  areYouSureYouWantToDelete: {
    id: 'fresco.settings.UserManagement.areYouSureYouWantToDelete',
    defaultMessage:
      'Are you sure you want to delete the user "{value1}"? This action cannot be undone.',
    description:
      'Researcher-facing settings / UserManagement: Are you sure you want to delete the user "value"? This action cannot be undone.',
  },
  resetAuthentication: {
    id: 'fresco.settings.UserManagement.resetAuthentication',
    defaultMessage: 'Reset Authentication',
    description:
      'Researcher-facing settings / UserManagement: Reset Authentication',
  },
  thisWillRemoveAllPasskeys2FAAnd: {
    id: 'fresco.settings.UserManagement.thisWillRemoveAllPasskeys2FAAnd',
    defaultMessage:
      'This will remove all passkeys, 2FA, and recovery codes for {value1}, and set a temporary password. They will need to set up their authentication again.',
    description:
      'Researcher-facing settings / UserManagement: This will remove all passkeys, 2FA, and recovery codes for value, and set a temporary password. They will need to set up',
  },
  loggedInAs: {
    id: 'fresco.settings.UserManagement.loggedInAs',
    defaultMessage: 'Logged in as:',
    description: 'Researcher-facing settings / UserManagement: Logged in as:',
  },
  changePassword: {
    id: 'fresco.settings.UserManagement.changePassword',
    defaultMessage: 'Change Password',
    description: 'Researcher-facing settings / UserManagement: Change Password',
  },
  securityWarning: {
    id: 'fresco.settings.UserManagement.securityWarning',
    defaultMessage: 'Security Warning',
    description:
      'Researcher-facing settings / UserManagement: Security Warning',
  },
  yourAccountIsOnlyProtectedByA: {
    id: 'fresco.settings.UserManagement.yourAccountIsOnlyProtectedByA',
    defaultMessage:
      'Your account is only protected by a password. Enable two-factor authentication for stronger security.',
    description:
      'Researcher-facing settings / UserManagement: Your account is only protected by a password. Enable two-factor authentication for stronger security.',
  },
  switchToPasskeyAuthentication: {
    id: 'fresco.settings.UserManagement.switchToPasskeyAuthentication',
    defaultMessage: 'Switch to Passkey Authentication',
    description:
      'Researcher-facing settings / UserManagement: Switch to Passkey Authentication',
  },
  removeYourPasswordAndTwoFactorAuthentication: {
    id: 'fresco.settings.UserManagement.removeYourPasswordAndTwoFactorAuthentication',
    defaultMessage:
      'Remove your password and two-factor authentication, and use a passkey to sign in instead.',
    description:
      'Researcher-facing settings / UserManagement: Remove your password and two-factor authentication, and use a passkey to sign in instead.',
  },
  switchToPasskey: {
    id: 'fresco.settings.UserManagement.switchToPasskey',
    defaultMessage: 'Switch to Passkey',
    description:
      'Researcher-facing settings / UserManagement: Switch to Passkey',
  },
  youAreTheOnlyUserIfYou: {
    id: 'fresco.settings.UserManagement.youAreTheOnlyUserIfYou',
    defaultMessage:
      'You are the only user. If you lose access to your passkey, you will be locked out. Consider adding another user or backing up your passkey.',
    description:
      'Researcher-facing settings / UserManagement: You are the only user. If you lose access to your passkey, you will be locked out. Consider adding another user or backi',
  },
  switchToPasswordAuthentication: {
    id: 'fresco.settings.UserManagement.switchToPasswordAuthentication',
    defaultMessage: 'Switch to Password Authentication',
    description:
      'Researcher-facing settings / UserManagement: Switch to Password Authentication',
  },
  removeAllPasskeysAndSwitchToPassword: {
    id: 'fresco.settings.UserManagement.removeAllPasskeysAndSwitchToPassword',
    defaultMessage:
      'Remove all passkeys and switch to password-based authentication.',
    description:
      'Researcher-facing settings / UserManagement: Remove all passkeys and switch to password-based authentication.',
  },
  switchToPassword: {
    id: 'fresco.settings.UserManagement.switchToPassword',
    defaultMessage: 'Switch to Password',
    description:
      'Researcher-facing settings / UserManagement: Switch to Password',
  },
  allUsers: {
    id: 'fresco.settings.UserManagement.allUsers',
    defaultMessage: 'All Users',
    description: 'Researcher-facing settings / UserManagement: All Users',
  },
  addUser: {
    id: 'fresco.settings.UserManagement.addUser',
    defaultMessage: 'Add User',
    description: 'Researcher-facing settings / UserManagement: Add User',
  },
  noUsersCreatedYet: {
    id: 'fresco.settings.UserManagement.noUsersCreatedYet',
    defaultMessage: 'No users created yet.',
    description:
      'Researcher-facing settings / UserManagement: No users created yet.',
  },
  deleteSelected: {
    id: 'fresco.settings.UserManagement.deleteSelected',
    defaultMessage: 'Delete Selected',
    description: 'Researcher-facing settings / UserManagement: Delete Selected',
  },
  updateYourAccountPassword: {
    id: 'fresco.settings.UserManagement.updateYourAccountPassword',
    defaultMessage: 'Update your account password.',
    description:
      'Researcher-facing settings / UserManagement: Update your account password.',
  },
  updatePassword: {
    id: 'fresco.settings.UserManagement.updatePassword',
    defaultMessage: 'Update Password',
    description: 'Researcher-facing settings / UserManagement: Update Password',
  },
  passwordUpdatedSuccessfully: {
    id: 'fresco.settings.UserManagement.passwordUpdatedSuccessfully',
    defaultMessage: 'Password updated successfully!',
    description:
      'Researcher-facing settings / UserManagement: Password updated successfully!',
  },
  currentPassword: {
    id: 'fresco.settings.UserManagement.currentPassword',
    defaultMessage: 'Current Password',
    description:
      'Researcher-facing settings / UserManagement: Current Password',
  },
  newPassword: {
    id: 'fresco.settings.UserManagement.newPassword',
    defaultMessage: 'New Password',
    description: 'Researcher-facing settings / UserManagement: New Password',
  },
  atLeast8CharactersWithLowercaseUppercase: {
    id: 'fresco.settings.UserManagement.atLeast8CharactersWithLowercaseUppercase',
    defaultMessage:
      'At least 8 characters with lowercase, uppercase, number, and symbol',
    description:
      'Researcher-facing settings / UserManagement: At least 8 characters with lowercase, uppercase, number, and symbol',
  },
  confirmNewPassword: {
    id: 'fresco.settings.UserManagement.confirmNewPassword',
    defaultMessage: 'Confirm New Password',
    description:
      'Researcher-facing settings / UserManagement: Confirm New Password',
  },
  createUser: {
    id: 'fresco.settings.UserManagement.createUser',
    defaultMessage: 'Create User',
    description: 'Researcher-facing settings / UserManagement: Create User',
  },
  atLeast4CharactersNoSpaces: {
    id: 'fresco.settings.UserManagement.atLeast4CharactersNoSpaces',
    defaultMessage: 'At least 4 characters, no spaces',
    description:
      'Researcher-facing settings / UserManagement: At least 4 characters, no spaces',
  },
  mustBeUnique: {
    id: 'fresco.settings.UserManagement.mustBeUnique',
    defaultMessage: 'Must be unique',
    description: 'Researcher-facing settings / UserManagement: Must be unique',
  },
  password: {
    id: 'fresco.settings.UserManagement.password',
    defaultMessage: 'Password',
    description: 'Researcher-facing settings / UserManagement: Password',
  },
  confirmPassword: {
    id: 'fresco.settings.UserManagement.confirmPassword',
    defaultMessage: 'Confirm Password',
    description:
      'Researcher-facing settings / UserManagement: Confirm Password',
  },
  temporaryPassword: {
    id: 'fresco.settings.UserManagement.temporaryPassword',
    defaultMessage: 'Temporary Password',
    description:
      'Researcher-facing settings / UserManagement: Temporary Password',
  },
  theUserSAuthenticationHasBeenReset: {
    id: 'fresco.settings.UserManagement.theUserSAuthenticationHasBeenReset',
    defaultMessage:
      "The user's authentication has been reset. Share this temporary password with them so they can sign in and set up their account again.",
    description:
      "Researcher-facing settings / UserManagement: The user's authentication has been reset. Share this temporary password with them so they can sign in and set up their a",
  },
  enterYourCurrentPasswordThenRegisterA: {
    id: 'fresco.settings.UserManagement.enterYourCurrentPasswordThenRegisterA',
    defaultMessage:
      'Enter your current password, then register a passkey. Your password and two-factor authentication will be removed.',
    description:
      'Researcher-facing settings / UserManagement: Enter your current password, then register a passkey. Your password and two-factor authentication will be removed.',
  },
  allYourPasskeysWillBeRemovedAnd: {
    id: 'fresco.settings.UserManagement.allYourPasskeysWillBeRemovedAnd',
    defaultMessage:
      'All your passkeys will be removed and replaced with a password.',
    description:
      'Researcher-facing settings / UserManagement: All your passkeys will be removed and replaced with a password.',
  },
  verifyYourIdentityWithAPasskeyTo: {
    id: 'fresco.settings.UserManagement.verifyYourIdentityWithAPasskeyTo',
    defaultMessage: 'Verify your identity with a passkey to continue.',
    description:
      'Researcher-facing settings / UserManagement: Verify your identity with a passkey to continue.',
  },
});

type UserRow = GetUsersReturnType[number];

type Passkey = {
  id: string;
  friendlyName: string | null;
  deviceType: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  backedUp: boolean;
};

type UserManagementProps = {
  usersPromise: Promise<GetUsersReturnType>;
  currentUserId: string;
  currentUsername: string;
  hasTwoFactorPromise: Promise<boolean>;
  passkeysPromise: Promise<Passkey[]>;
  hasPasswordPromise: Promise<boolean>;
  sandboxMode: boolean;
  /** Whether the installation requires two-factor authentication (`REQUIRE_TWO_FACTOR`). */
  twoFactorRequired: boolean;
};

function makeUserColumns(
  intl: IntlShape,
  currentUserId: string,
  userCount: number,
  onDeleteUser: (user: UserRow) => void,
  onResetAuth: (user: UserRow) => void,
): StrictColumnDef<UserRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(value)
          }
          aria-label={intl.formatMessage(messages.selectAll)}
        />
      ),
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(value)}
            aria-label={intl.formatMessage(messages.selectRow)}
            disabled={isCurrentUser}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'username',
      accessorKey: 'username',
      sortFn: 'text',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.username)}
        />
      ),
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        return (
          <div
            className="flex items-center gap-2"
            data-testid={`user-row-${row.original.username}`}
          >
            <span>{row.original.username}</span>
            {isCurrentUser && (
              <span className="text-sm text-current/50">
                {intl.formatMessage(messages.you)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'authMethod',
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.authMethod)}
        />
      ),
      cell: ({ row }) => {
        const hasPasskeys = row.original.webAuthnCredentials.length > 0;
        const has2FA = row.original.totpCredential?.verified === true;

        if (hasPasskeys) return intl.formatMessage(messages.passkeyAuth);
        if (has2FA) return intl.formatMessage(messages.passwordTwoFactor);
        return intl.formatMessage(messages.passwordAuth);
      },
    },
    {
      id: 'actions',
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.actions)}
        />
      ),
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        const isLastUser = userCount <= 1;
        const hasAuth =
          row.original.totpCredential?.verified === true ||
          row.original.webAuthnCredentials.length > 0;
        return (
          <div className="flex gap-2">
            {hasAuth && !isCurrentUser && (
              <Button
                onClick={() => onResetAuth(row.original)}
                size="sm"
                data-testid={`reset-auth-${row.original.username}`}
              >
                {intl.formatMessage(messages.resetAuth)}
              </Button>
            )}
            <Button
              onClick={() => onDeleteUser(row.original)}
              color="destructive"
              size="sm"
              disabled={isCurrentUser || isLastUser}
              data-testid={`delete-user-${row.original.username}`}
            >
              {intl.formatMessage(commonMessages.delete)}
            </Button>
          </div>
        );
      },
    },
  ];
}

export default function UserManagement({
  usersPromise,
  currentUserId,
  currentUsername,
  hasTwoFactorPromise,
  passkeysPromise,
  hasPasswordPromise,
  sandboxMode,
  twoFactorRequired,
}: UserManagementProps) {
  'use no memo';

  const intl = useAppIntl();
  const usernameSchema = z
    .string({ error: createMessageError(messages.usernameMinimum) })
    .check(z.minLength(4, createMessageError(messages.usernameMinimum)))
    .check(
      z.refine(
        (s) => !s.includes(' '),
        createMessageError(messages.usernameSpaces),
      ),
    );

  const usernameUniqueSchema = z
    .string({ error: createMessageError(messages.usernameMinimum) })
    .check(
      z.refine(async (username) => {
        if (!username || username.length < 4 || username.includes(' ')) {
          return true; // Let the basic validation handle these cases
        }
        const result = await checkUsernameAvailable(username);
        return result.available;
      }, createMessageError(messages.usernameTaken)),
    );

  // Built from the shared rule in ~/utils/isStrongPassword rather than restating
  // it: the server enforces the same rule through `strongPasswordSchema`, which
  // cannot be imported here (schemas/ is server-only, and client code uses
  // zod/mini). Each check stays separate so the form reports precisely which
  // requirement is unmet.
  const passwordSchema = z
    .string({ error: createMessageError(passwordMessages.strong) })
    .check(
      z.minLength(
        PASSWORD_MIN_LENGTH,
        createMessageError(passwordMessages.minimum, {
          count: PASSWORD_MIN_LENGTH,
        }),
      ),
      ...getPasswordRules(createMessageError).map(({ pattern, message }) =>
        z.regex(pattern, message),
      ),
    );

  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.

  const router = useRouter();
  const users = use(usersPromise);
  const hasTwoFactor = use(hasTwoFactorPromise);
  const initialPasskeys = use(passkeysPromise);
  const hasPassword = use(hasPasswordPromise);
  const [isCreating, setIsCreating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSwitchToPasskey, setShowSwitchToPasskey] = useState(false);
  const [showSwitchToPassword, setShowSwitchToPassword] = useState(false);
  const [switchToPasswordReauthed, setSwitchToPasswordReauthed] =
    useState(false);
  const [switchToPasswordReauthError, setSwitchToPasswordReauthError] =
    useState<string | null>(null);
  const [switchToPasswordReauthLoading, setSwitchToPasswordReauthLoading] =
    useState(false);

  const { confirm } = useDialog();

  const doDeleteUsers = useCallback(
    async (usersToDelete: UserRow[]) => {
      const ids = usersToDelete.map((u) => u.id);
      const result = await deleteUsers({ ids });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    },
    [router],
  );

  const handleDeleteUser = useCallback(
    (user: UserRow) => {
      void confirm({
        title: <AppMessage message={messages.deleteUser} />,
        description: (
          <AppMessage
            message={messages.areYouSureYouWantToDelete}
            values={{
              value1: user.username,
            }}
          />
        ),
        confirmLabel: <AppMessage message={messages.deleteUser} />,
        intent: 'destructive',
        onConfirm: () => doDeleteUsers([user]),
      });
    },
    [confirm, doDeleteUsers],
  );

  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleResetAuth = useCallback(
    (user: UserRow) => {
      void confirm({
        title: <AppMessage message={messages.resetAuthentication} />,
        description: (
          <AppMessage
            message={messages.thisWillRemoveAllPasskeys2FAAnd}
            values={{ value1: user.username }}
          />
        ),
        confirmLabel: <AppMessage message={messages.resetAuth} />,
        intent: 'destructive',
        onConfirm: async () => {
          const result = await resetAuthForUser(user.id);
          if (result.error) {
            setError(result.error);
          } else if (result.data?.temporaryPassword) {
            setTempPassword(result.data.temporaryPassword);
          }
        },
      });
    },
    [confirm],
  );

  const columns = makeUserColumns(
    intl,
    currentUserId,
    users.length,
    handleDeleteUser,
    handleResetAuth,
  );

  const handleDeleteSelected = useCallback(
    (selectedUsers: UserRow[]) => {
      const deletableUsers = selectedUsers.filter(
        (user) => user.id !== currentUserId,
      );

      if (deletableUsers.length === 0) {
        setError(
          createMessageError(messages.copyYouCannotDeleteYourOwnAccount),
        );
        return;
      }

      const isSingle = deletableUsers.length === 1;
      void confirm({
        title: isSingle ? (
          <AppMessage message={messages.copyDeleteUser} />
        ) : (
          <AppMessage message={messages.copyDeleteMultipleUsers} />
        ),
        description: isSingle ? (
          <AppMessage
            message={messages.copyAreYouSureYouWantToDelete}
            values={{
              value1: deletableUsers[0]?.username,
            }}
          />
        ) : (
          <AppMessage
            message={messages.copyAreYouSureYouWantToDelete2}
            values={{
              value1: deletableUsers.length,
            }}
          />
        ),
        confirmLabel: isSingle ? (
          <AppMessage message={messages.copyDeleteUser} />
        ) : (
          <AppMessage
            message={messages.deleteCount}
            values={{
              count: deletableUsers.length,
            }}
          />
        ),
        intent: 'destructive',
        onConfirm: () => doDeleteUsers(deletableUsers),
      });
    },
    [currentUserId, confirm, doDeleteUsers],
  );

  const { table } = useClientDataTable({
    data: users,
    columns,
    enablePagination: false,
    enableRowSelection: (row) => row.original.id !== currentUserId,
  });

  const handleCreateUser = async (
    values: unknown,
  ): Promise<FormSubmissionResult> => {
    setError(null);

    const { username, password, confirmPassword } = values as {
      username: string;
      password: string;
      confirmPassword: string;
    };

    if (password !== confirmPassword) {
      return {
        success: false,
        formErrors: [createMessageError(messages.copyPasswordsDoNotMatch)],
      };
    }

    const result = await createUser({ username, password, confirmPassword });

    if (result.error) {
      return {
        success: false,
        formErrors: [result.error],
      };
    }

    setIsCreating(false);
    router.refresh();
    return { success: true };
  };

  const handleChangePassword = async (
    values: unknown,
  ): Promise<FormSubmissionResult> => {
    const { currentPassword, newPassword, confirmNewPassword } = values as {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    };

    if (newPassword !== confirmNewPassword) {
      return {
        success: false,
        formErrors: [createMessageError(messages.copyNewPasswordsDoNotMatch)],
      };
    }

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (result.error) {
      return {
        success: false,
        formErrors: [result.error],
      };
    }

    setPasswordChangeSuccess(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordChangeSuccess(false);
    }, 1500);

    return { success: true };
  };

  const handleSwitchToPasskey = async (
    values: unknown,
  ): Promise<FormSubmissionResult> => {
    const { currentPassword } = values as { currentPassword: string };

    const { error: genError, data } = await generateRegistrationOptions();
    if (genError || !data) {
      return {
        success: false,
        formErrors: [
          genError ??
            createMessageError(messages.copyFailedToStartRegistration),
        ],
      };
    }

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: data.options });
    } catch (e) {
      return {
        success: false,
        formErrors: [
          describePasskeyCeremonyError(
            e,
            'registration',
            messages.copyPasskeyCreationFailed,
          ),
        ],
      };
    }

    const result = await switchToPasskeyMode({ currentPassword, credential });

    if (result.error) {
      return { success: false, formErrors: [result.error] };
    }

    setShowSwitchToPasskey(false);
    router.refresh();
    return { success: true };
  };

  const handleSwitchToPasswordReauth = async () => {
    setSwitchToPasswordReauthError(null);
    setSwitchToPasswordReauthLoading(true);

    try {
      const { error: genError, data: regData } =
        await generateAuthenticationOptions();
      if (genError || !regData) {
        setSwitchToPasswordReauthError(
          genError ??
            createMessageError(messages.copyFailedToStartVerification),
        );
        return;
      }

      const credential = await startAuthentication({
        optionsJSON: regData.options,
      });

      const result = await verifyPasskeyReauth({ credential });

      if (result.error) {
        setSwitchToPasswordReauthError(result.error);
        return;
      }

      setSwitchToPasswordReauthed(true);
    } catch (e) {
      setSwitchToPasswordReauthError(
        describePasskeyCeremonyError(
          e,
          'reauth',
          messages.copyVerificationFailed,
        ),
      );
    } finally {
      // It holds the dialog open, so it must clear however this ends.
      setSwitchToPasswordReauthLoading(false);
    }
  };

  const handleSwitchToPassword = async (
    values: unknown,
  ): Promise<FormSubmissionResult> => {
    const { newPassword, confirmNewPassword } = values as {
      newPassword: string;
      confirmNewPassword: string;
    };

    if (newPassword !== confirmNewPassword) {
      return {
        success: false,
        formErrors: [createMessageError(messages.copyPasswordsDoNotMatch)],
      };
    }

    const result = await switchToPasswordMode(newPassword);

    if (result.error) {
      return { success: false, formErrors: [result.error] };
    }

    setShowSwitchToPassword(false);
    setSwitchToPasswordReauthed(false);
    router.refresh();
    return { success: true };
  };

  return (
    <div className="space-y-6">
      <Surface className="mt-2 divide-y divide-current/10 p-6" spacing="sm">
        <div className="flex flex-col justify-between gap-4 pb-4">
          <div className="tablet-landscape:flex-row tablet-landscape:items-center tablet-landscape:justify-between flex flex-col gap-4 pb-4">
            <div className="tablet-landscape:gap-6 flex items-center gap-4">
              <div className="bg-surface-2 text-surface-2-contrast tablet-landscape:size-14 inset-surface flex size-10 shrink-0 items-center justify-center rounded-full">
                <User className="tablet-landscape:size-8 size-5" />
              </div>
              <div className="min-w-0">
                <Paragraph intent="smallText" margin="none">
                  {intl.formatMessage(messages.loggedInAs)}
                </Paragraph>
                <Heading level="h4" margin="none">
                  {currentUsername}
                </Heading>
              </div>
            </div>
            {hasPassword && !sandboxMode && (
              <Button
                onClick={() => setIsChangingPassword(true)}
                size="sm"
                className="tablet-landscape:w-auto w-full"
                color="primary"
              >
                {intl.formatMessage(messages.changePassword)}
              </Button>
            )}
          </div>
          {hasPassword && !hasTwoFactor && !sandboxMode && (
            <Alert variant="warning" className="my-0">
              <AlertTitle>
                {intl.formatMessage(messages.securityWarning)}
              </AlertTitle>
              <AlertDescription>
                {intl.formatMessage(messages.yourAccountIsOnlyProtectedByA)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {hasPassword ? (
          <>
            <TwoFactorSettings
              hasTwoFactor={hasTwoFactor}
              userCount={users.length}
              sandboxMode={sandboxMode}
              twoFactorRequired={twoFactorRequired}
            />
            {!sandboxMode && (
              <SettingsField
                label={intl.formatMessage(
                  messages.switchToPasskeyAuthentication,
                )}
                description={intl.formatMessage(
                  messages.removeYourPasswordAndTwoFactorAuthentication,
                )}
                control={
                  <Button
                    onClick={() => setShowSwitchToPasskey(true)}
                    size="sm"
                    color="destructive"
                  >
                    {intl.formatMessage(messages.switchToPasskey)}
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <>
            <PasskeySettings
              initialPasskeys={initialPasskeys}
              sandboxMode={sandboxMode}
              hasPassword={hasPassword}
            />
            {users.length === 1 && (
              <div className="py-4">
                <Alert variant="info" className="my-0">
                  <AlertDescription>
                    {intl.formatMessage(messages.youAreTheOnlyUserIfYou)}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {!sandboxMode && (
              <SettingsField
                label={intl.formatMessage(
                  messages.switchToPasswordAuthentication,
                )}
                description={intl.formatMessage(
                  messages.removeAllPasskeysAndSwitchToPassword,
                )}
                control={
                  <Button
                    onClick={() => setShowSwitchToPassword(true)}
                    size="sm"
                    color="destructive"
                  >
                    {intl.formatMessage(messages.switchToPassword)}
                  </Button>
                }
              />
            )}
          </>
        )}
      </Surface>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level="label">
            {intl.formatMessage(messages.allUsers)}
          </Heading>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            color="primary"
            icon={<Plus />}
            className="shrink-0"
          >
            {intl.formatMessage(messages.addUser)}
          </Button>
        </div>

        <DataTable
          table={table}
          emptyText={intl.formatMessage(messages.noUsersCreatedYet)}
          showPagination={false}
          floatingBar={
            <DataTableFloatingBar table={table}>
              <Button
                onClick={() =>
                  handleDeleteSelected(
                    table.getSelectedRowModel().rows.map((r) => r.original),
                  )
                }
                color="destructive"
                icon={<Trash className="size-4" />}
              >
                {intl.formatMessage(messages.deleteSelected)}
              </Button>
            </DataTableFloatingBar>
          }
        />
      </div>
      <FormStoreProvider>
        <FormDialog
          open={isChangingPassword}
          closeDialog={() => {
            setIsChangingPassword(false);
            setPasswordChangeSuccess(false);
          }}
          title={intl.formatMessage(messages.changePassword)}
          description={intl.formatMessage(messages.updateYourAccountPassword)}
          footer={(heldOpen) =>
            passwordChangeSuccess ? null : (
              <>
                <Button
                  type="button"
                  disabled={heldOpen}
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordChangeSuccess(false);
                  }}
                >
                  {intl.formatMessage(commonMessages.cancel)}
                </Button>
                <SubmitButton form="changePasswordForm">
                  {intl.formatMessage(messages.updatePassword)}
                </SubmitButton>
              </>
            )
          }
        >
          {passwordChangeSuccess ? (
            <div className="text-success text-center">
              {intl.formatMessage(messages.passwordUpdatedSuccessfully)}
            </div>
          ) : (
            <FormWithoutProvider
              onSubmit={handleChangePassword}
              id="changePasswordForm"
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={currentUsername}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
              <Field
                name="currentPassword"
                label={intl.formatMessage(messages.currentPassword)}
                component={PasswordField}
                required
                autoComplete="current-password"
              />
              <Field
                name="newPassword"
                label={intl.formatMessage(messages.newPassword)}
                component={PasswordField}
                showStrengthMeter
                required
                autoComplete="new-password"
                custom={{
                  schema: passwordSchema,
                  hint: intl.formatMessage(
                    messages.atLeast8CharactersWithLowercaseUppercase,
                  ),
                }}
              />
              <Field
                name="confirmNewPassword"
                label={intl.formatMessage(messages.confirmNewPassword)}
                component={PasswordField}
                required
                autoComplete="new-password"
                sameAs="newPassword"
              />
            </FormWithoutProvider>
          )}
        </FormDialog>
      </FormStoreProvider>
      {/* Create User Dialog */}
      <FormStoreProvider>
        <FormDialog
          open={isCreating}
          closeDialog={() => {
            setIsCreating(false);
            setError(null);
          }}
          title={intl.formatMessage(messages.addUser)}
          footer={(heldOpen) => (
            <>
              <Button
                type="button"
                disabled={heldOpen}
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
              >
                {intl.formatMessage(commonMessages.cancel)}
              </Button>
              <SubmitButton form="createUserForm">
                {intl.formatMessage(messages.createUser)}
              </SubmitButton>
            </>
          )}
        >
          <FormWithoutProvider onSubmit={handleCreateUser} id="createUserForm">
            {error && (
              <div className="text-destructive mb-4 text-sm">
                <AppErrorMessage error={error} />
              </div>
            )}
            <Field
              name="username"
              label={intl.formatMessage(messages.username)}
              component={InputField}
              required
              autoComplete="off"
              showValidationHints
              validateOnChange
              validateOnChangeDelay={500}
              custom={[
                {
                  schema: usernameSchema,
                  hint: intl.formatMessage(messages.atLeast4CharactersNoSpaces),
                },
                {
                  schema: usernameUniqueSchema,
                  hint: intl.formatMessage(messages.mustBeUnique),
                },
              ]}
              autoFocus
            />
            <Field
              name="password"
              label={intl.formatMessage(messages.password)}
              component={PasswordField}
              showStrengthMeter
              showValidationHints
              required
              autoComplete="off"
              custom={{
                schema: passwordSchema,
                hint: intl.formatMessage(
                  messages.atLeast8CharactersWithLowercaseUppercase,
                ),
              }}
            />
            <Field
              name="confirmPassword"
              label={intl.formatMessage(messages.confirmPassword)}
              component={PasswordField}
              required
              autoComplete="off"
            />
          </FormWithoutProvider>
        </FormDialog>
      </FormStoreProvider>
      <Dialog
        open={tempPassword !== null}
        closeDialog={() => setTempPassword(null)}
        title={intl.formatMessage(messages.temporaryPassword)}
        description={intl.formatMessage(
          messages.theUserSAuthenticationHasBeenReset,
        )}
        footer={
          <Button color="primary" onClick={() => setTempPassword(null)}>
            {intl.formatMessage(commonMessages.done)}
          </Button>
        }
      >
        <div className="bg-surface-1 rounded p-4 text-center">
          <code className="font-monospace text-lg tracking-wider">
            {tempPassword}
          </code>
        </div>
      </Dialog>
      {/* Switch to Passkey Dialog */}
      <FormStoreProvider>
        <FormDialog
          open={showSwitchToPasskey}
          closeDialog={() => setShowSwitchToPasskey(false)}
          title={intl.formatMessage(messages.switchToPasskeyAuthentication)}
          description={intl.formatMessage(
            messages.enterYourCurrentPasswordThenRegisterA,
          )}
          footer={(heldOpen) => (
            <>
              <Button
                type="button"
                disabled={heldOpen}
                onClick={() => setShowSwitchToPasskey(false)}
              >
                {intl.formatMessage(commonMessages.cancel)}
              </Button>
              <SubmitButton form="switchToPasskeyForm" color="destructive">
                {intl.formatMessage(messages.switchToPasskey)}
              </SubmitButton>
            </>
          )}
        >
          <FormWithoutProvider
            onSubmit={handleSwitchToPasskey}
            id="switchToPasskeyForm"
          >
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={currentUsername}
              readOnly
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <Field
              name="currentPassword"
              label={intl.formatMessage(messages.currentPassword)}
              component={PasswordField}
              required
              autoComplete="current-password"
            />
          </FormWithoutProvider>
        </FormDialog>
      </FormStoreProvider>
      {/* Switch to Password Dialog */}
      <FormStoreProvider>
        <FormDialog
          open={showSwitchToPassword}
          // The passkey re-authentication finishes once started, and would then
          // mark this dialog verified for its next opening, so it holds the
          // dialog open just as the password form's submission does.
          busy={switchToPasswordReauthLoading}
          closeDialog={() => {
            setShowSwitchToPassword(false);
            setSwitchToPasswordReauthed(false);
            setSwitchToPasswordReauthError(null);
          }}
          title={intl.formatMessage(messages.switchToPasswordAuthentication)}
          description={intl.formatMessage(
            messages.allYourPasskeysWillBeRemovedAnd,
          )}
          footer={(heldOpen) =>
            switchToPasswordReauthed ? (
              <>
                <Button
                  type="button"
                  disabled={heldOpen}
                  onClick={() => {
                    setShowSwitchToPassword(false);
                    setSwitchToPasswordReauthed(false);
                    setSwitchToPasswordReauthError(null);
                  }}
                >
                  {intl.formatMessage(commonMessages.cancel)}
                </Button>
                <SubmitButton form="switchToPasswordForm" color="destructive">
                  {intl.formatMessage(messages.switchToPassword)}
                </SubmitButton>
              </>
            ) : null
          }
        >
          {switchToPasswordReauthed ? (
            <FormWithoutProvider
              onSubmit={handleSwitchToPassword}
              id="switchToPasswordForm"
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={currentUsername}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
              <Field
                name="newPassword"
                label={intl.formatMessage(messages.newPassword)}
                component={PasswordField}
                showStrengthMeter
                required
                autoComplete="new-password"
                custom={{
                  schema: passwordSchema,
                  hint: intl.formatMessage(
                    messages.atLeast8CharactersWithLowercaseUppercase,
                  ),
                }}
              />
              <Field
                name="confirmNewPassword"
                label={intl.formatMessage(messages.confirmNewPassword)}
                component={PasswordField}
                required
                autoComplete="new-password"
                sameAs="newPassword"
              />
            </FormWithoutProvider>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <Paragraph className="text-center">
                {intl.formatMessage(messages.verifyYourIdentityWithAPasskeyTo)}
              </Paragraph>
              {switchToPasswordReauthError && (
                <p className="text-destructive text-sm">
                  <AppErrorMessage error={switchToPasswordReauthError} />
                </p>
              )}
              <Button
                onClick={() => void handleSwitchToPasswordReauth()}
                disabled={switchToPasswordReauthLoading}
                color="primary"
              >
                {switchToPasswordReauthLoading
                  ? intl.formatMessage(messages.copyVerifying)
                  : intl.formatMessage(messages.copyVerifyWithPasskey)}
              </Button>
            </div>
          )}
        </FormDialog>
      </FormStoreProvider>
    </div>
  );
}

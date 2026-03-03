'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Trash, User } from 'lucide-react';
import { use, useCallback, useState } from 'react';
import { z } from 'zod/mini';
import {
  changePassword,
  checkUsernameAvailable,
  createUser,
  deleteUsers,
} from '~/actions/users';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
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
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { DataTable } from '~/components/DataTable/DataTable';
import { DataTableFloatingBar } from '~/components/DataTable/DataTableFloatingBar';
import Surface from '~/components/layout/Surface';
import SettingsField from '~/components/settings/SettingsField';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import Dialog from '~/lib/dialogs/Dialog';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import InputField from '~/lib/form/components/fields/InputField';
import PasswordField from '~/lib/form/components/fields/PasswordField';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { type GetUsersReturnType } from '~/queries/users';

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
};

const usernameSchema = z
  .string()
  .check(z.minLength(4, 'Username must be at least 4 characters'))
  .check(z.refine((s) => !s.includes(' '), 'Username cannot contain spaces'));

const usernameUniqueSchema = z.string().check(
  z.refine(async (username) => {
    if (!username || username.length < 4 || username.includes(' ')) {
      return true; // Let the basic validation handle these cases
    }
    const result = await checkUsernameAvailable(username);
    return result.available;
  }, 'Username is already taken'),
);

const passwordSchema = z
  .string()
  .check(z.minLength(8, 'Password must be at least 8 characters'))
  .check(z.regex(/[a-z]/, 'Password must contain at least 1 lowercase letter'))
  .check(z.regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter'))
  .check(z.regex(/[0-9]/, 'Password must contain at least 1 number'))
  .check(z.regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 symbol'));

function makeUserColumns(
  currentUserId: string,
  userCount: number,
  onDeleteUser: (user: UserRow) => void,
  onResetAuth: (user: UserRow) => void,
): ColumnDef<UserRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label="Select row"
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Username" />
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
              <span className="text-sm text-current/50">(you)</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'authMethod',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Auth Method" />
      ),
      cell: ({ row }) => {
        const hasPasskeys = row.original.webAuthnCredentials.length > 0;
        const has2FA = row.original.totpCredential?.verified === true;

        if (hasPasskeys) return 'Passkey';
        if (has2FA) return 'Password + 2FA';
        return 'Password';
      },
    },
    {
      id: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
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
                Reset Auth
              </Button>
            )}
            <Button
              onClick={() => onDeleteUser(row.original)}
              color="destructive"
              size="sm"
              disabled={isCurrentUser || isLastUser}
              data-testid={`delete-user-${row.original.username}`}
            >
              Delete
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
}: UserManagementProps) {
  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.
  'use no memo';
  const initialUsers = use(usersPromise);
  const hasTwoFactor = use(hasTwoFactorPromise);
  const initialPasskeys = use(passkeysPromise);
  const hasPassword = use(hasPasswordPromise);
  const [users, setUsers] = useState(initialUsers);
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
      } else {
        setUsers((prev) => prev.filter((user) => !ids.includes(user.id)));
      }
    },
    [setUsers],
  );

  const handleDeleteUser = useCallback(
    (user: UserRow) => {
      void confirm({
        title: 'Delete User',
        description: `Are you sure you want to delete the user "${user.username}"? This action cannot be undone.`,
        confirmLabel: 'Delete User',
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
        title: 'Reset Authentication',
        description: `This will remove all passkeys, 2FA, and recovery codes for ${user.username}, and set a temporary password. They will need to set up their authentication again.`,
        confirmLabel: 'Reset Auth',
        intent: 'destructive',
        onConfirm: async () => {
          const result = await resetAuthForUser(user.id);
          if (result.error) {
            setError(result.error);
          } else {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id
                  ? {
                      ...u,
                      totpCredential: null,
                      webAuthnCredentials: [],
                    }
                  : u,
              ),
            );
            if (result.data?.temporaryPassword) {
              setTempPassword(result.data.temporaryPassword);
            }
          }
        },
      });
    },
    [confirm],
  );

  const columns = makeUserColumns(
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
        setError('You cannot delete your own account');
        return;
      }

      const isSingle = deletableUsers.length === 1;
      void confirm({
        title: isSingle ? 'Delete User' : 'Delete Multiple Users',
        description: isSingle
          ? `Are you sure you want to delete the user "${deletableUsers[0]?.username}"? This action cannot be undone.`
          : `Are you sure you want to delete ${deletableUsers.length} users? This action cannot be undone.`,
        confirmLabel: isSingle
          ? 'Delete User'
          : `Delete ${deletableUsers.length} Users`,
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
        formErrors: ['Passwords do not match'],
      };
    }

    const result = await createUser({ username, password, confirmPassword });

    if (result.error) {
      return {
        success: false,
        formErrors: [result.error],
      };
    }

    setUsers([
      ...users,
      {
        id: crypto.randomUUID(),
        username,
        totpCredential: null,
        webAuthnCredentials: [],
      },
    ]);
    setIsCreating(false);
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
        formErrors: ['New passwords do not match'],
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
        formErrors: [genError ?? 'Failed to start registration'],
      };
    }

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: data.options });
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        return { success: false, formErrors: ['Passkey creation cancelled.'] };
      }
      return { success: false, formErrors: ['Passkey creation failed.'] };
    }

    const result = await switchToPasskeyMode({ currentPassword, credential });

    if (result.error) {
      return { success: false, formErrors: [result.error] };
    }

    window.location.reload();
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
          genError ?? 'Failed to start verification',
        );
        setSwitchToPasswordReauthLoading(false);
        return;
      }

      const credential = await startAuthentication({
        optionsJSON: regData.options,
      });

      const result = await verifyPasskeyReauth({ credential });

      if (result.error) {
        setSwitchToPasswordReauthError(result.error);
        setSwitchToPasswordReauthLoading(false);
        return;
      }

      setSwitchToPasswordReauthed(true);
      setSwitchToPasswordReauthLoading(false);
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setSwitchToPasswordReauthLoading(false);
        return;
      }
      setSwitchToPasswordReauthError('Verification failed');
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
        formErrors: ['Passwords do not match'],
      };
    }

    const result = await switchToPasswordMode(newPassword);

    if (result.error) {
      return { success: false, formErrors: [result.error] };
    }

    window.location.reload();
    return { success: true };
  };

  return (
    <div className="space-y-6">
      <Heading level="label">Current User</Heading>
      <Surface
        level={1}
        className="mt-2 divide-y divide-current/10 p-6"
        spacing="sm"
      >
        <div className="flex flex-col justify-between gap-4 pb-4">
          <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col gap-4 pb-4">
            <div className="tablet:gap-6 flex items-center gap-4">
              <div className="bg-surface-2 text-surface-2-contrast tablet:size-14 inset-surface flex size-10 shrink-0 items-center justify-center rounded-full">
                <User className="tablet:size-8 size-5" />
              </div>
              <div className="min-w-0">
                <Paragraph intent="smallText" margin="none">
                  Logged in as:
                </Paragraph>
                <Paragraph className="truncate font-medium">
                  {currentUsername}
                </Paragraph>
              </div>
            </div>
            {hasPassword && !sandboxMode && (
              <Button
                onClick={() => setIsChangingPassword(true)}
                size="sm"
                className="tablet:w-auto w-full"
                color="primary"
              >
                Change Password
              </Button>
            )}
          </div>
          {hasPassword && !hasTwoFactor && !sandboxMode && (
            <Alert variant="warning" className="my-0">
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                Your account is only protected by a password. Enable two-factor
                authentication for stronger security.
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
            />
            {!sandboxMode && (
              <SettingsField
                label="Switch to Passkey Authentication"
                description="Remove your password and two-factor authentication, and use a passkey to sign in instead."
                control={
                  <Button
                    onClick={() => setShowSwitchToPasskey(true)}
                    size="sm"
                    color="destructive"
                  >
                    Switch to Passkey
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
                <Alert variant="warning" className="my-0">
                  <AlertTitle>Single User Warning</AlertTitle>
                  <AlertDescription>
                    You are the only user. If you lose access to your passkey,
                    you will be locked out. Consider adding another user or
                    switching to password authentication.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {!sandboxMode && (
              <SettingsField
                label="Switch to Password Authentication"
                description="Remove all passkeys and switch to password-based authentication."
                control={
                  <Button
                    onClick={() => setShowSwitchToPassword(true)}
                    size="sm"
                    color="destructive"
                  >
                    Switch to Password
                  </Button>
                }
              />
            )}
          </>
        )}
      </Surface>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level="label">All Users</Heading>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            color="primary"
            icon={<Plus />}
          >
            Add User
          </Button>
        </div>

        <DataTable
          table={table}
          surfaceLevel={1}
          emptyText="No users created yet."
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
                Delete Selected
              </Button>
            </DataTableFloatingBar>
          }
        />
      </div>
      <FormStoreProvider>
        <Dialog
          open={isChangingPassword}
          closeDialog={() => {
            setIsChangingPassword(false);
            setPasswordChangeSuccess(false);
          }}
          title="Change Password"
          description="Update your account password."
          footer={
            passwordChangeSuccess ? null : (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordChangeSuccess(false);
                  }}
                >
                  Cancel
                </Button>
                <SubmitButton form="changePasswordForm">
                  Update Password
                </SubmitButton>
              </>
            )
          }
        >
          {passwordChangeSuccess ? (
            <div className="text-success text-center">
              Password updated successfully!
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
                label="Current Password"
                component={PasswordField}
                required
                autoComplete="current-password"
              />
              <Field
                name="newPassword"
                label="New Password"
                component={PasswordField}
                showStrengthMeter
                required
                autoComplete="new-password"
                custom={{
                  schema: passwordSchema,
                  hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
                }}
              />
              <Field
                name="confirmNewPassword"
                label="Confirm New Password"
                component={PasswordField}
                required
                autoComplete="new-password"
                sameAs="newPassword"
              />
            </FormWithoutProvider>
          )}
        </Dialog>
      </FormStoreProvider>
      {/* Create User Dialog */}
      <FormStoreProvider>
        <Dialog
          open={isCreating}
          closeDialog={() => {
            setIsCreating(false);
            setError(null);
          }}
          title="Add User"
          description="Create a new user account."
          footer={
            <>
              <Button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <SubmitButton form="createUserForm">Create User</SubmitButton>
            </>
          }
        >
          <FormWithoutProvider onSubmit={handleCreateUser} id="createUserForm">
            {error && (
              <div className="text-destructive mb-4 text-sm">{error}</div>
            )}
            <Field
              name="username"
              label="Username"
              component={InputField}
              required
              autoComplete="off"
              showValidationHints
              validateOnChange
              validateOnChangeDelay={500}
              custom={[
                {
                  schema: usernameSchema,
                  hint: 'At least 4 characters, no spaces',
                },
                {
                  schema: usernameUniqueSchema,
                  hint: 'Must be unique',
                },
              ]}
              autoFocus
            />
            <Field
              name="password"
              label="Password"
              component={PasswordField}
              showStrengthMeter
              showValidationHints
              required
              autoComplete="off"
              custom={{
                schema: passwordSchema,
                hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
              }}
            />
            <Field
              name="confirmPassword"
              label="Confirm Password"
              component={PasswordField}
              required
              autoComplete="off"
            />
          </FormWithoutProvider>
        </Dialog>
      </FormStoreProvider>
      <Dialog
        open={tempPassword !== null}
        closeDialog={() => setTempPassword(null)}
        title="Temporary Password"
        description="The user's authentication has been reset. Share this temporary password with them so they can sign in and set up their account again."
        footer={
          <Button color="primary" onClick={() => setTempPassword(null)}>
            Done
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
        <Dialog
          open={showSwitchToPasskey}
          closeDialog={() => setShowSwitchToPasskey(false)}
          title="Switch to Passkey Authentication"
          description="Enter your current password, then register a passkey. Your password and two-factor authentication will be removed."
          footer={
            <>
              <Button
                type="button"
                onClick={() => setShowSwitchToPasskey(false)}
              >
                Cancel
              </Button>
              <SubmitButton form="switchToPasskeyForm" color="destructive">
                Switch to Passkey
              </SubmitButton>
            </>
          }
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
              label="Current Password"
              component={PasswordField}
              required
              autoComplete="current-password"
            />
          </FormWithoutProvider>
        </Dialog>
      </FormStoreProvider>
      {/* Switch to Password Dialog */}
      <FormStoreProvider>
        <Dialog
          open={showSwitchToPassword}
          closeDialog={() => {
            setShowSwitchToPassword(false);
            setSwitchToPasswordReauthed(false);
            setSwitchToPasswordReauthError(null);
            setSwitchToPasswordReauthLoading(false);
          }}
          title="Switch to Password Authentication"
          description="All your passkeys will be removed and replaced with a password."
          footer={
            switchToPasswordReauthed ? (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSwitchToPassword(false);
                    setSwitchToPasswordReauthed(false);
                    setSwitchToPasswordReauthError(null);
                  }}
                >
                  Cancel
                </Button>
                <SubmitButton form="switchToPasswordForm" color="destructive">
                  Switch to Password
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
                label="New Password"
                component={PasswordField}
                showStrengthMeter
                required
                autoComplete="new-password"
                custom={{
                  schema: passwordSchema,
                  hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
                }}
              />
              <Field
                name="confirmNewPassword"
                label="Confirm New Password"
                component={PasswordField}
                required
                autoComplete="new-password"
                sameAs="newPassword"
              />
            </FormWithoutProvider>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <Paragraph className="text-center">
                Verify your identity with a passkey to continue.
              </Paragraph>
              {switchToPasswordReauthError && (
                <p className="text-destructive text-sm">
                  {switchToPasswordReauthError}
                </p>
              )}
              <Button
                onClick={() => void handleSwitchToPasswordReauth()}
                disabled={switchToPasswordReauthLoading}
                color="primary"
              >
                {switchToPasswordReauthLoading
                  ? 'Verifying...'
                  : 'Verify with passkey'}
              </Button>
            </div>
          )}
        </Dialog>
      </FormStoreProvider>
    </div>
  );
}

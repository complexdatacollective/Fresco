'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Plus, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import {
  changePassword,
  checkUsernameAvailable,
  createUser,
  deleteUsers,
} from '~/actions/users';
import { DataTable } from '~/components/DataTable/DataTable';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import InputField from '~/lib/form/components/fields/InputField';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { type GetUsersReturnType } from '~/queries/users';

type UserRow = GetUsersReturnType[number];

type UserManagementProps = {
  users: GetUsersReturnType;
  currentUserId: string;
  currentUsername: string;
};

const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .refine((s) => !s.includes(' '), 'Username cannot contain spaces');

const usernameUniqueSchema = z.string().refine(
  async (username) => {
    if (!username || username.length < 4 || username.includes(' ')) {
      return true; // Let the basic validation handle these cases
    }
    const result = await checkUsernameAvailable(username);
    return result.available;
  },
  { message: 'Username is already taken' },
);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 symbol');

function makeUserColumns(
  currentUserId: string,
  userCount: number,
  onDeleteUser: (user: UserRow) => void,
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
      header: 'Username',
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        return (
          <div className="flex items-center gap-2">
            <span>{row.original.username}</span>
            {isCurrentUser && (
              <span className="text-sm text-current/50">(you)</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === currentUserId;
        const isLastUser = userCount <= 1;
        return (
          <Button
            onClick={() => onDeleteUser(row.original)}
            color="destructive"
            size="sm"
            disabled={isCurrentUser || isLastUser}
          >
            Delete
          </Button>
        );
      },
    },
  ];
}

export default function UserManagement({
  users: initialUsers,
  currentUserId,
  currentUsername,
}: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isCreating, setIsCreating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const columns = makeUserColumns(currentUserId, users.length, handleDeleteUser);

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

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    const result = await createUser(formData);

    if (result.error) {
      return {
        success: false,
        formErrors: [result.error],
      };
    }

    setUsers([...users, { id: crypto.randomUUID(), username }]);
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

  const handleDeleteSelected = useCallback(
    (selectedUsers: UserRow[]) => {
      // Filter out current user - they can't delete themselves
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

  return (
    <div className="space-y-6">
      {/* Current User Card */}
      <Surface
        level={1}
        className="flex items-center justify-between gap-4 p-6"
        spacing="sm"
      >
        <div className="flex items-center gap-6">
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
            <User className="size-8" />
          </div>
          <div>
            <Paragraph intent="smallText" margin="none">
              Logged in as:
            </Paragraph>
            <Paragraph className="font-medium">{currentUsername}</Paragraph>
          </div>
        </div>
        <Button onClick={() => setIsChangingPassword(true)} size="sm">
          Change Password
        </Button>
      </Surface>

      {/* All Users Section */}
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
          columns={columns}
          data={users}
          handleDeleteSelected={handleDeleteSelected}
          surfaceLevel={1}
        />
      </div>

      {/* Change Password Dialog */}
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
                component={InputField}
                type="password"
                required
                autoComplete="current-password"
              />
              <Field
                name="newPassword"
                label="New Password"
                component={InputField}
                type="password"
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
                component={InputField}
                type="password"
                required
                autoComplete="new-password"
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
              autoComplete="username"
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
              component={InputField}
              type="password"
              required
              autoComplete="new-password"
              custom={{
                schema: passwordSchema,
                hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
              }}
            />
            <Field
              name="confirmPassword"
              label="Confirm Password"
              component={InputField}
              type="password"
              required
              autoComplete="new-password"
            />
          </FormWithoutProvider>
        </Dialog>
      </FormStoreProvider>

    </div>
  );
}

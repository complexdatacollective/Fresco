'use client';

import { User } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { changePassword, createUser, deleteUser } from '~/actions/users';
import { Button } from '~/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import Dialog from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import InputField from '~/lib/form/components/fields/InputField';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmissionResult } from '~/lib/form/store/types';
import { type GetUsersReturnType } from '~/queries/users';

type UserManagementProps = {
  users: GetUsersReturnType;
  currentUserId: string;
  currentUsername: string;
};

const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .refine((s) => !s.includes(' '), 'Username cannot contain spaces');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 symbol');

export default function UserManagement({
  users: initialUsers,
  currentUserId,
  currentUsername,
}: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isCreating, setIsCreating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDeleteUser = async (id: string) => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteUser({ id });

    if (result.error) {
      setError(result.error);
    } else {
      setUsers(users.filter((user) => user.id !== id));
    }

    setIsConfirmingDelete(null);
    setIsDeleting(false);
  };

  const userToDelete = users.find((u) => u.id === isConfirmingDelete);

  return (
    <div className="space-y-6">
      {/* Current User Card */}
      <div className="bg-surface-1 flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-current/50">Logged in as</p>
            <p className="font-medium">{currentUsername}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsChangingPassword(true)}
          variant="outline"
          size="sm"
        >
          Change Password
        </Button>
      </div>

      {/* All Users Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-current/70">All Users</h3>
          <Button
            onClick={() => setIsCreating(true)}
            variant="outline"
            size="sm"
          >
            Add User
          </Button>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-current/70">No users found.</p>
        ) : (
          <Table
            surfaceProps={{ className: 'w-full rounded!' }}
            className="w-full"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.username}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-sm text-current/50">
                        (you)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => setIsConfirmingDelete(user.id)}
                      color="destructive"
                      size="sm"
                      disabled={user.id === currentUserId || users.length <= 1}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
                <SubmitButton>Update Password</SubmitButton>
              </>
            )
          }
        >
          {passwordChangeSuccess ? (
            <div className="text-success text-center">
              Password updated successfully!
            </div>
          ) : (
            <FormWithoutProvider onSubmit={handleChangePassword}>
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
              <SubmitButton>Create User</SubmitButton>
            </>
          }
        >
          <FormWithoutProvider onSubmit={handleCreateUser}>
            {error && (
              <div className="text-destructive mb-4 text-sm">{error}</div>
            )}
            <Field
              name="username"
              label="Username"
              component={InputField}
              required
              autoComplete="username"
              custom={{
                schema: usernameSchema,
                hint: 'At least 4 characters, no spaces',
              }}
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

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!isConfirmingDelete}
        closeDialog={() => setIsConfirmingDelete(null)}
        title="Delete User"
        description={`Are you sure you want to delete the user "${userToDelete?.username}"? This action cannot be undone.`}
        accent="destructive"
        footer={
          <>
            <Button onClick={() => setIsConfirmingDelete(null)}>Cancel</Button>
            <Button
              onClick={() =>
                isConfirmingDelete && handleDeleteUser(isConfirmingDelete)
              }
              color="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </>
        }
      />
    </div>
  );
}

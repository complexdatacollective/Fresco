'use client';

import { type ColumnDef, type Row } from '@tanstack/react-table';
import { Clipboard } from 'lucide-react';
import { useState } from 'react';
import {
  createApiToken,
  deleteApiToken,
  updateApiToken,
} from '~/actions/apiTokens';
import { DataTable } from '~/components/DataTable/DataTable';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import Dialog from '~/lib/dialogs/Dialog';
import InputField from '~/lib/form/components/fields/InputField';
import { type GetApiTokensReturnType } from '~/queries/apiTokens';
import { DataTableColumnHeader } from './DataTable/ColumnHeader';
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Switch } from './ui/switch';
import TimeAgo from './ui/TimeAgo';
import { useToast } from './ui/Toast';

type ApiToken = GetApiTokensReturnType[number];

type ApiTokenManagementProps = {
  tokens: GetApiTokensReturnType;
  disabled?: boolean;
};

export default function ApiTokenManagement({
  tokens: initialTokens,
  disabled,
}: ApiTokenManagementProps) {
  'use no memo';
  const [tokens, setTokens] = useState<ApiToken[]>(initialTokens);
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { add } = useToast();

  const handleCreateToken = async () => {
    setIsLoading(true);
    const result = await createApiToken({
      description: newTokenDescription || undefined,
    });

    if (result.error) {
      alert(result.error);
    } else if (result.data) {
      setTokens([
        {
          id: result.data.id,
          description: result.data.description,
          createdAt: result.data.createdAt,
          lastUsedAt: result.data.lastUsedAt,
          isActive: result.data.isActive,
        },
        ...tokens,
      ]);
      setCreatedToken(result.data.token);
      setNewTokenDescription('');
      setIsCreating(false);
    }

    setIsLoading(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const result = await updateApiToken({ id, isActive: !isActive });

    if (result.error) {
      alert(result.error);
    } else if (result.data) {
      setTokens(
        tokens.map((token) =>
          token.id === id ? { ...token, isActive: !isActive } : token,
        ),
      );
    }
  };

  const handleDeleteToken = async (token: ApiToken) => {
    setIsDeleting(true);
    const result = await deleteApiToken({ id: token.id });

    if (result.error) {
      add({ title: result.error, type: 'destructive' });
    } else {
      setTokens(tokens.filter((t) => t.id !== token.id));
      setTokenToDelete(null);
    }
    setIsDeleting(false);
  };

  const columns: ColumnDef<ApiToken>[] = [
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <span
          data-testid={`token-row-${row.original.description ?? 'Untitled'}`}
        >
          {row.original.description ?? <em>Untitled</em>}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <TimeAgo
          date={row.original.createdAt}
          className="flex space-x-2 truncate"
        />
      ),
    },
    {
      accessorKey: 'lastUsedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Used" />
      ),
      cell: ({ row }) => {
        if (!row.original.lastUsedAt) {
          return 'Never';
        }

        return (
          <TimeAgo
            date={row.original.lastUsedAt}
            className="flex space-x-2 truncate"
          />
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          disabled={disabled}
          onCheckedChange={() =>
            handleToggleActive(row.original.id, row.original.isActive)
          }
        />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<ApiToken> }) => (
        <Button
          onClick={() => setTokenToDelete(row.original)}
          color="destructive"
          size="sm"
          disabled={disabled}
          data-testid={`delete-token-${row.original.description ?? 'Untitled'}`}
        >
          Delete
        </Button>
      ),
    },
  ];

  const { table } = useClientDataTable({
    data: tokens,
    columns,
    enablePagination: false,
  });

  return (
    <div className="space-y-4" data-testid="api-token-management">
      <Button
        onClick={() => setIsCreating(true)}
        color="primary"
        size="sm"
        disabled={disabled}
        data-testid="create-token-button"
      >
        Create New Token
      </Button>
      <DataTable
        table={table}
        surfaceLevel={1}
        emptyText="No API tokens created yet."
        showPagination={false}
      />

      {/* Create Token Dialog */}
      <Dialog
        open={isCreating}
        closeDialog={() => setIsCreating(false)}
        title="Create API Token"
        description="Create a new API token for authenticating preview protocol uploads."
        footer={
          <>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewTokenDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateToken}
              disabled={isLoading}
              color="primary"
              data-testid="confirm-create-token-button"
            >
              {isLoading ? 'Creating...' : 'Create Token'}
            </Button>
          </>
        }
      >
        <div data-field-name="description">
          <Label htmlFor="description">Description (optional)</Label>
          <InputField
            id="description"
            placeholder="e.g., Development token"
            value={newTokenDescription}
            onChange={(value) => setNewTokenDescription(value ?? '')}
          />
        </div>
      </Dialog>

      {/* Show Created Token Dialog */}
      <Dialog
        accent="success"
        open={!!createdToken}
        closeDialog={() => setCreatedToken(null)}
        title="API Token Created"
        description="Your token has been created and is displayed below. Save this token somewhere safe now - you won't be able to see it again after you close this dialog."
        footer={
          <>
            <Button
              onClick={() => setCreatedToken(null)}
              data-testid="close-token-dialog-button"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(createdToken!);
                add({ title: 'Copied to clipboard', type: 'success' });
              }}
              icon={<Clipboard />}
              color="primary"
            >
              Copy to Clipboard
            </Button>
          </>
        }
      >
        <Alert variant="success" data-testid="created-token-alert">
          <AlertTitle>Your API Token</AlertTitle>
          <AlertDescription>
            <code className="font-monospace relative rounded px-[0.3rem] py-[0.2rem] text-sm">
              {createdToken}
            </code>
          </AlertDescription>
        </Alert>
      </Dialog>
      {/* Delete Token Confirmation Dialog */}
      <Dialog
        accent="destructive"
        open={!!tokenToDelete}
        closeDialog={() => setTokenToDelete(null)}
        title="Delete API Token"
        description="Are you sure you want to delete this API token? Any applications using this token will no longer be able to authenticate."
        footer={
          <>
            <Button
              onClick={() => setTokenToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => tokenToDelete && handleDeleteToken(tokenToDelete)}
              disabled={isDeleting}
              color="primary"
              data-testid="confirm-delete-token-button"
            >
              {isDeleting ? 'Deleting...' : 'Delete Token'}
            </Button>
          </>
        }
      />
    </div>
  );
}

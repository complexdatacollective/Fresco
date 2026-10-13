'use client';

import { type Row } from '@tanstack/react-table';
import { Clipboard } from 'lucide-react';
import { use, useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages, type IntlShape } from '@codaco/app-i18n/messages';
import {
  AppErrorMessage,
  AppMessage,
  useAppIntl,
} from '@codaco/app-i18n/react';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { DataTable } from '@codaco/fresco-ui/DataTable/DataTable';
import { type DataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import ToggleField from '@codaco/fresco-ui/form/fields/ToggleField';
import { Label } from '@codaco/fresco-ui/Label';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';
import { useToast } from '@codaco/fresco-ui/Toast';
import {
  createApiToken,
  deleteApiToken,
  updateApiToken,
} from '~/actions/apiTokens';
import { useClientDataTable } from '~/hooks/useClientDataTable';
import { type GetApiTokensReturnType } from '~/queries/apiTokens';

const messages = defineMessages({
  activeToken: {
    id: 'fresco.apiToken.activeToken',
    defaultMessage: 'Active token: {name}',
    description:
      'Accessible label for an API token activation switch. Name is its description, never its secret.',
  },
  copyNever: {
    id: 'fresco.ApiTokenManagement.copyNever',
    defaultMessage: 'Never',
    description: 'Researcher-facing ApiTokenManagement: Never',
  },
  copyCreating: {
    id: 'fresco.ApiTokenManagement.copyCreating',
    defaultMessage: 'Creating...',
    description: 'Researcher-facing ApiTokenManagement: Creating...',
  },
  copyCreateToken: {
    id: 'fresco.ApiTokenManagement.copyCreateToken',
    defaultMessage: 'Create Token',
    description: 'Researcher-facing ApiTokenManagement: Create Token',
  },
  copyDeleting: {
    id: 'fresco.ApiTokenManagement.copyDeleting',
    defaultMessage: 'Deleting...',
    description: 'Researcher-facing ApiTokenManagement: Deleting...',
  },
  copyDeleteToken: {
    id: 'fresco.ApiTokenManagement.copyDeleteToken',
    defaultMessage: 'Delete Token',
    description: 'Researcher-facing ApiTokenManagement: Delete Token',
  },
  description: {
    id: 'fresco.ApiTokenManagement.description',
    defaultMessage: 'Description',
    description: 'Researcher-facing ApiTokenManagement: Description',
  },
  untitled: {
    id: 'fresco.ApiTokenManagement.untitled',
    defaultMessage: 'Untitled',
    description: 'Researcher-facing ApiTokenManagement: Untitled',
  },
  created: {
    id: 'fresco.ApiTokenManagement.created',
    defaultMessage: 'Created',
    description: 'Researcher-facing ApiTokenManagement: Created',
  },
  lastUsed: {
    id: 'fresco.ApiTokenManagement.lastUsed',
    defaultMessage: 'Last Used',
    description: 'Researcher-facing ApiTokenManagement: Last Used',
  },
  status: {
    id: 'fresco.ApiTokenManagement.status',
    defaultMessage: 'Status',
    description: 'Researcher-facing ApiTokenManagement: Status',
  },
  createNewToken: {
    id: 'fresco.ApiTokenManagement.createNewToken',
    defaultMessage: 'Create New Token',
    description: 'Researcher-facing ApiTokenManagement: Create New Token',
  },
  noAPITokensCreatedYet: {
    id: 'fresco.ApiTokenManagement.noAPITokensCreatedYet',
    defaultMessage: 'No API tokens created yet.',
    description:
      'Researcher-facing ApiTokenManagement: No API tokens created yet.',
  },
  createAPIToken: {
    id: 'fresco.ApiTokenManagement.createAPIToken',
    defaultMessage: 'Create API Token',
    description: 'Researcher-facing ApiTokenManagement: Create API Token',
  },
  createANewAPITokenForAuthenticating: {
    id: 'fresco.ApiTokenManagement.createANewAPITokenForAuthenticating',
    defaultMessage:
      'Create a new API token for authenticating Interview Data API requests.',
    description:
      'Researcher-facing ApiTokenManagement: Create a new API token for authenticating Interview Data API requests.',
  },
  descriptionOptional: {
    id: 'fresco.ApiTokenManagement.descriptionOptional',
    defaultMessage: 'Description (optional)',
    description: 'Researcher-facing ApiTokenManagement: Description (optional)',
  },
  eGDevelopmentToken: {
    id: 'fresco.ApiTokenManagement.eGDevelopmentToken',
    defaultMessage: 'e.g., Development token',
    description:
      'Researcher-facing ApiTokenManagement: e.g., Development token',
  },
  aPITokenCreated: {
    id: 'fresco.ApiTokenManagement.aPITokenCreated',
    defaultMessage: 'API Token Created',
    description: 'Researcher-facing ApiTokenManagement: API Token Created',
  },
  yourTokenHasBeenCreatedAndIs: {
    id: 'fresco.ApiTokenManagement.yourTokenHasBeenCreatedAndIs',
    defaultMessage:
      "Your token has been created and is displayed below. Save this token somewhere safe now - you won't be able to see it again after you close this dialog.",
    description:
      "Researcher-facing ApiTokenManagement: Your token has been created and is displayed below. Save this token somewhere safe now - you won't be able to see it aga",
  },
  copyToClipboard: {
    id: 'fresco.ApiTokenManagement.copyToClipboard',
    defaultMessage: 'Copy to Clipboard',
    description: 'Researcher-facing ApiTokenManagement: Copy to Clipboard',
  },
  copiedToClipboard: {
    id: 'fresco.ApiTokenManagement.copiedToClipboard',
    defaultMessage: 'Copied to clipboard',
    description: 'Researcher-facing ApiTokenManagement: Copied to clipboard',
  },
  yourAPIToken: {
    id: 'fresco.ApiTokenManagement.yourAPIToken',
    defaultMessage: 'Your API Token',
    description: 'Researcher-facing ApiTokenManagement: Your API Token',
  },
  deleteAPIToken: {
    id: 'fresco.ApiTokenManagement.deleteAPIToken',
    defaultMessage: 'Delete API Token',
    description: 'Researcher-facing ApiTokenManagement: Delete API Token',
  },
  areYouSureYouWantToDelete: {
    id: 'fresco.ApiTokenManagement.areYouSureYouWantToDelete',
    defaultMessage:
      'Are you sure you want to delete this API token? Any applications using this token will no longer be able to authenticate.',
    description:
      'Researcher-facing ApiTokenManagement: Are you sure you want to delete this API token? Any applications using this token will no longer be able to authenticate',
  },
});

type ApiToken = GetApiTokensReturnType[number];

type ApiTokenManagementProps = {
  tokensPromise: Promise<GetApiTokensReturnType>;
  disabled?: boolean;
};

const copiedToClipboardTitle = (
  <AppMessage message={messages.copiedToClipboard} />
);

const getApiTokenColumns = ({
  intl,
  disabled,
  onToggleActive,
  onRequestDelete,
}: {
  intl: IntlShape;
  disabled?: boolean;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onRequestDelete: (token: ApiToken) => void;
}): StrictColumnDef<ApiToken>[] => [
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={intl.formatMessage(messages.description)}
      />
    ),
    cell: ({ row }) => (
      <span data-testid={`token-row-${row.original.description ?? 'Untitled'}`}>
        {row.original.description ?? (
          <em>{intl.formatMessage(messages.untitled)}</em>
        )}
      </span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    sortFn: 'datetime',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={intl.formatMessage(messages.created)}
      />
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
    sortFn: 'datetime',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={intl.formatMessage(messages.lastUsed)}
      />
    ),
    cell: ({ row }) => {
      if (!row.original.lastUsedAt) {
        return intl.formatMessage(messages.copyNever);
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
    sortFn: 'basic',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={intl.formatMessage(messages.status)}
      />
    ),
    cell: ({ row }) => (
      <ToggleField
        aria-label={intl.formatMessage(messages.activeToken, {
          name:
            row.original.description ?? intl.formatMessage(messages.untitled),
        })}
        value={row.original.isActive}
        disabled={disabled}
        onChange={() => onToggleActive(row.original.id, row.original.isActive)}
      />
    ),
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }: { row: Row<DataTableFeatures, ApiToken> }) => (
      <Button
        onClick={() => onRequestDelete(row.original)}
        color="destructive"
        size="sm"
        disabled={disabled}
        data-testid={`delete-token-${row.original.description ?? 'Untitled'}`}
      >
        {intl.formatMessage(commonMessages.delete)}
      </Button>
    ),
  },
];

export default function ApiTokenManagement({
  tokensPromise,
  disabled,
}: ApiTokenManagementProps) {
  'use no memo';

  const intl = useAppIntl();

  // TanStack Table: consumers must also opt out so React Compiler doesn't memoize JSX that depends on the table ref.

  const initialTokens = use(tokensPromise);
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
    try {
      const result = await createApiToken({
        description: newTokenDescription || undefined,
      });

      if (result.error) {
        add({
          title: <AppErrorMessage error={result.error} />,
          variant: 'destructive',
        });
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const result = await updateApiToken({ id, isActive: !isActive });

    if (result.error) {
      add({
        title: <AppErrorMessage error={result.error} />,
        variant: 'destructive',
      });
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
    try {
      const result = await deleteApiToken({ id: token.id });

      if (result.error) {
        add({
          title: <AppErrorMessage error={result.error} />,
          variant: 'destructive',
        });
      } else {
        setTokens(tokens.filter((t) => t.id !== token.id));
        setTokenToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = getApiTokenColumns({
    intl,
    disabled,
    onToggleActive: handleToggleActive,
    onRequestDelete: setTokenToDelete,
  });

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
        {intl.formatMessage(messages.createNewToken)}
      </Button>
      <DataTable
        table={table}
        emptyText={intl.formatMessage(messages.noAPITokensCreatedYet)}
        showPagination={false}
      />

      {/* Create Token Dialog */}
      <Dialog
        open={isCreating}
        closeDialog={() => setIsCreating(false)}
        // The token is created once the request is sent; leaving mid-way would
        // look like a cancel and then pop up the created token anyway.
        dismissible={!isLoading}
        title={intl.formatMessage(messages.createAPIToken)}
        description={intl.formatMessage(
          messages.createANewAPITokenForAuthenticating,
        )}
        footer={
          <>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewTokenDescription('');
              }}
              disabled={isLoading}
            >
              {intl.formatMessage(commonMessages.cancel)}
            </Button>
            <Button
              onClick={handleCreateToken}
              disabled={isLoading}
              color="primary"
              data-testid="confirm-create-token-button"
            >
              {isLoading
                ? intl.formatMessage(messages.copyCreating)
                : intl.formatMessage(messages.copyCreateToken)}
            </Button>
          </>
        }
      >
        <div data-field-name="description">
          <Label htmlFor="description">
            {intl.formatMessage(messages.descriptionOptional)}
          </Label>
          <InputField
            id="description"
            placeholder={intl.formatMessage(messages.eGDevelopmentToken)}
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
        title={intl.formatMessage(messages.aPITokenCreated)}
        description={intl.formatMessage(messages.yourTokenHasBeenCreatedAndIs)}
        footer={
          <>
            <Button
              onClick={() => setCreatedToken(null)}
              data-testid="close-token-dialog-button"
            >
              {intl.formatMessage(commonMessages.close)}
            </Button>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(createdToken!);
                add({
                  title: copiedToClipboardTitle,
                  variant: 'success',
                });
              }}
              icon={<Clipboard />}
              color="primary"
            >
              {intl.formatMessage(messages.copyToClipboard)}
            </Button>
          </>
        }
      >
        <Alert variant="success" data-testid="created-token-alert">
          <AlertTitle>{intl.formatMessage(messages.yourAPIToken)}</AlertTitle>
          <AlertDescription>
            <code className="font-monospace relative rounded px-1.5 py-0.5 text-sm">
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
        // The deletion runs to completion once started, so leaving mid-way
        // would look like a cancel while the token is still revoked.
        dismissible={!isDeleting}
        title={intl.formatMessage(messages.deleteAPIToken)}
        description={intl.formatMessage(messages.areYouSureYouWantToDelete)}
        footer={
          <>
            <Button
              onClick={() => setTokenToDelete(null)}
              disabled={isDeleting}
            >
              {intl.formatMessage(commonMessages.cancel)}
            </Button>
            <Button
              onClick={() => tokenToDelete && handleDeleteToken(tokenToDelete)}
              disabled={isDeleting}
              color="primary"
              data-testid="confirm-delete-token-button"
            >
              {isDeleting
                ? intl.formatMessage(messages.copyDeleting)
                : intl.formatMessage(messages.copyDeleteToken)}
            </Button>
          </>
        }
      />
    </div>
  );
}

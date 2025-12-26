'use client';

import { useState } from 'react';
import {
  createApiToken,
  deleteApiToken,
  updateApiToken,
} from '~/actions/apiTokens';
import { Dialog } from '~/lib/dialogs/Dialog';
import InputField from '~/lib/form/components/fields/InputField';
import { type GetApiTokensReturnType } from '~/queries/apiTokens';
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Switch } from './ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

type ApiTokenManagementProps = {
  tokens: GetApiTokensReturnType;
};

export default function ApiTokenManagement({
  tokens: initialTokens,
}: ApiTokenManagementProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDeleteToken = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API token?')) {
      return;
    }

    const result = await deleteApiToken({ id });

    if (result.error) {
      alert(result.error);
    } else {
      setTokens(tokens.filter((token) => token.id !== id));
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsCreating(true)} variant="outline" size="sm">
        Create New Token
      </Button>

      {tokens.length === 0 ? (
        <p className="text-sm text-current/70">No API tokens created yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>{token.description ?? <em>Untitled</em>}</TableCell>
                <TableCell>{formatDate(token.createdAt)}</TableCell>
                <TableCell>{formatDate(token.lastUsedAt)}</TableCell>
                <TableCell>
                  <Switch
                    checked={token.isActive}
                    onCheckedChange={() =>
                      handleToggleActive(token.id, token.isActive)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDeleteToken(token.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Token Dialog */}
      <Dialog
        open={isCreating}
        closeDialog={() => setIsCreating(false)}
        title="Create API Token"
        description="Create a new API token for authenticating preview protocol uploads."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewTokenDescription('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateToken} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Token'}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <InputField
            id="description"
            placeholder="e.g., Development token"
            value={newTokenDescription}
            onChange={(e) => setNewTokenDescription(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Show Created Token Dialog */}
      <Dialog
        open={!!createdToken}
        closeDialog={() => setCreatedToken(null)}
        title="API Token Created"
        description="Save this token securely. You won't be able to see it again."
        footer={
          <>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(createdToken!);
              }}
              variant="outline"
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setCreatedToken(null)}>Close</Button>
          </>
        }
      >
        <Alert>
          <AlertTitle>Your API Token</AlertTitle>
          <AlertDescription>
            <code className="font-monospace relative rounded px-[0.3rem] py-[0.2rem] text-sm">
              {createdToken}
            </code>
          </AlertDescription>
        </Alert>
      </Dialog>
    </div>
  );
}

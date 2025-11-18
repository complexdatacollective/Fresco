'use client';

import { useState } from 'react';
import {
  createApiToken,
  deleteApiToken,
  updateApiToken,
} from '~/actions/apiTokens';
import { type GetApiTokensReturnType } from '~/queries/apiTokens';
import { Button } from './ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/Input';
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
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';

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
      <Button
        onClick={() => setIsCreating(true)}
        variant="outline"
        size="sm"
      >
        Create New Token
      </Button>

      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No API tokens created yet.
        </p>
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
                <TableCell>
                  {token.description ?? <em>Untitled</em>}
                </TableCell>
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
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Token</DialogTitle>
            <DialogDescription>
              Create a new API token for authenticating preview protocol
              uploads.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Development token"
                value={newTokenDescription}
                onChange={(e) => setNewTokenDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Created Token Dialog */}
      <Dialog open={!!createdToken} onOpenChange={() => setCreatedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Token Created</DialogTitle>
            <DialogDescription>
              Save this token securely. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTitle>Your API Token</AlertTitle>
            <AlertDescription>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {createdToken}
              </code>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(createdToken!);
              }}
              variant="outline"
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setCreatedToken(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

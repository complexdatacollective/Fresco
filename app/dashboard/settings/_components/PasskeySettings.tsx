'use client';

import { startRegistration } from '@simplewebauthn/browser';
import { KeyRound, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  generateRegistrationOptions,
  removePasskey,
  verifyRegistration,
} from '~/actions/webauthn';
import SettingsField from '~/components/settings/SettingsField';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';

type Passkey = {
  id: string;
  friendlyName: string | null;
  deviceType: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  backedUp: boolean;
};

type PasskeySettingsProps = {
  initialPasskeys: Passkey[];
  sandboxMode: boolean;
  hasPassword: boolean;
};

function formatDate(date: Date | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PasskeySettings({
  initialPasskeys,
  sandboxMode,
  hasPassword,
}: PasskeySettingsProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useDialog();

  const handleAddPasskey = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: genError, data } = await generateRegistrationOptions();
      if (genError || !data) {
        setError(genError ?? 'Failed to start registration');
        return;
      }

      // IMMEDIATELY call startRegistration — preserves Safari user gesture
      const credential = await startRegistration({
        optionsJSON: data.options,
      });

      const result = await verifyRegistration({ credential });
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setPasskeys((prev) => [
          {
            id: result.data.id,
            friendlyName: result.data.friendlyName,
            deviceType: result.data.deviceType,
            createdAt: result.data.createdAt,
            lastUsedAt: null,
            backedUp: false,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        return;
      }
      setError('Passkey registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePasskey = (passkey: Passkey) => {
    void confirm({
      title: 'Remove Passkey',
      description: `Remove "${passkey.friendlyName ?? 'Unnamed passkey'}"? You won't be able to sign in with it anymore.`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        const result = await removePasskey(passkey.id);
        if (result.error) {
          setError(result.error);
        } else {
          setPasskeys((prev) => prev.filter((p) => p.id !== passkey.id));
        }
      },
    });
  };

  return (
    <SettingsField
      label="Passkeys"
      description={
        passkeys.length === 0
          ? 'Register a passkey for the highest level of security. You will sign in without a password using biometrics or a security key.'
          : `${String(passkeys.length)} passkey${passkeys.length === 1 ? '' : 's'} registered.`
      }
      testId="passkey-field"
      control={
        <Button
          size="sm"
          onClick={() => void handleAddPasskey()}
          disabled={sandboxMode || loading}
          color="primary"
          icon={<Plus />}
        >
          {loading ? 'Registering...' : 'Add passkey'}
        </Button>
      }
    >
      {error && <p className="text-destructive mb-3 text-sm">{error}</p>}

      {passkeys.length > 0 && (
        <div className="flex flex-col gap-2">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              data-testid="passkey-item"
              className="flex items-center justify-between rounded border p-3"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="text-neutral size-5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {passkey.friendlyName ?? 'Unnamed passkey'}
                    </span>
                    <Badge variant="outline">
                      {passkey.deviceType === 'multiDevice'
                        ? 'Synced'
                        : 'Device-bound'}
                    </Badge>
                  </div>
                  <div className="text-neutral flex gap-3 text-xs">
                    <span data-testid="passkey-date-created">
                      Added {formatDate(passkey.createdAt)}
                    </span>
                    <span data-testid="passkey-date-used">
                      Last used {formatDate(passkey.lastUsedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="text"
                size="sm"
                onClick={() => handleRemovePasskey(passkey)}
                disabled={
                  sandboxMode || (passkeys.length === 1 && !hasPassword)
                }
                title={
                  passkeys.length === 1 && !hasPassword
                    ? 'Set a password before removing your only passkey'
                    : undefined
                }
              >
                <Trash className="size-4" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </SettingsField>
  );
}

'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import z from 'zod';
import { regenerateInstallationId } from '~/actions/appSettings';
import { Button } from '~/components/ui/Button';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

export default function UpdateInstallationId({
  installationId,
  readOnly,
}: {
  installationId?: string;
  readOnly?: boolean;
}) {
  const [currentId, setCurrentId] = useState(installationId);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const newId = await regenerateInstallationId();
      setCurrentId(newId);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <UpdateSettingsValue
      settingsKey="installationId"
      initialValue={currentId}
      readOnly={readOnly}
      schema={z.string().min(1, 'Installation ID cannot be empty')}
      suffixComponent={
        <Button
          disabled={readOnly ?? isRegenerating}
          onClick={handleRegenerate}
          variant="outline"
          size="sm"
        >
          {isRegenerating ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
        </Button>
      }
    />
  );
}

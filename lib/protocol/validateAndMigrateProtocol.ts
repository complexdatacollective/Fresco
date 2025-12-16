import {
  type CurrentProtocol,
  migrateProtocol,
  validateProtocol,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';

export type ProtocolValidationSuccess = {
  success: true;
  protocol: CurrentProtocol;
};

export type ProtocolValidationError =
  | { success: false; error: 'invalid-object' }
  | { success: false; error: 'unsupported-version'; version: unknown }
  | { success: false; error: 'validation-failed'; validationResult: unknown };

export type ProtocolValidationResult =
  | ProtocolValidationSuccess
  | ProtocolValidationError;

/**
 * Validates and migrates a protocol JSON object.
 *
 * This is a shared utility used by both the protocol import flow (useProtocolImport)
 * and the preview API route. It handles:
 * 1. Basic object validation
 * 2. Schema version checking against APP_SUPPORTED_SCHEMA_VERSIONS
 * 3. Migration from older schema versions to v8
 * 4. Full protocol validation
 *
 * Returns a discriminated union so consumers can handle errors appropriately
 * for their context (e.g., JSON responses for preview vs UI error states for useProtocolImport hook).
 */
export async function validateAndMigrateProtocol(
  protocolJson: VersionedProtocol,
): Promise<ProtocolValidationResult> {
  // Check protocol object exists
  if (!protocolJson || typeof protocolJson !== 'object') {
    return { success: false, error: 'invalid-object' };
  }

  // Check schema version
  const protocolVersion = protocolJson.schemaVersion;
  if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
    return {
      success: false,
      error: 'unsupported-version',
      version: protocolVersion,
    };
  }

  // Migrate if needed
  const protocolToValidate = (
    protocolJson.schemaVersion < 8
      ? migrateProtocol(protocolJson, 8)
      : protocolJson
  ) as CurrentProtocol;

  // Validate
  const validationResult = await validateProtocol(protocolToValidate);

  if (!validationResult.success) {
    return {
      success: false,
      error: 'validation-failed',
      validationResult,
    };
  }

  return { success: true, protocol: validationResult.data as CurrentProtocol };
}

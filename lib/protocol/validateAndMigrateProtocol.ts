import {
  CURRENT_SCHEMA_VERSION,
  type CurrentProtocol,
  getMigrationInfo,
  migrateProtocol,
  validateProtocol,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';

type ProtocolValidationSuccess = {
  success: true;
  protocol: CurrentProtocol;
};

export type ProtocolValidationError =
  | { success: false; error: 'invalid-object' }
  | { success: false; error: 'unsupported-version'; version: unknown }
  | { success: false; error: 'validation-failed'; validationResult: unknown }
  | {
      success: false;
      error: 'missing-dependencies';
      missingDependencies: string[];
    };

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
 * 3. Migration from older schema versions to v8 (with dependency checking)
 * 4. Full protocol validation
 *
 * Returns a discriminated union so consumers can handle errors appropriately
 * for their context (e.g., JSON responses for preview vs UI error states for useProtocolImport hook).
 *
 * @param protocolJson - The protocol JSON to validate
 * @param dependencies - Dependencies required for migration (e.g., { name: 'Protocol Name' } for v7→v8)
 */
export async function validateAndMigrateProtocol(
  protocolJson: VersionedProtocol,
  dependencies: Record<string, unknown> = {},
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
  let protocolToValidate: CurrentProtocol;

  if (protocolVersion < CURRENT_SCHEMA_VERSION) {
    // Check required dependencies for migration
    const migrationInfo = getMigrationInfo(
      protocolVersion,
      CURRENT_SCHEMA_VERSION,
    );
    const missingDependencies = migrationInfo.dependencies.filter(
      (dep) => !(dep in dependencies),
    );

    if (missingDependencies.length > 0) {
      return {
        success: false,
        error: 'missing-dependencies',
        missingDependencies,
      };
    }

    protocolToValidate = migrateProtocol(
      protocolJson,
      CURRENT_SCHEMA_VERSION,
      dependencies,
    );
  } else {
    protocolToValidate = protocolJson as CurrentProtocol;
  }

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

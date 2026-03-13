import { createId } from '@paralleldrive/cuid2';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash } from 'ohash';
import pg from 'pg';
import type JSZip from 'jszip';
import {
  type CurrentProtocol,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { log } from './logger.js';

/**
 * Create the initial network structure for a new interview.
 * Must match the NcNetwork type from @codaco/shared-consts.
 */
function createInitialNetwork() {
  return {
    ego: {
      _uid: randomUUID(),
      attributes: {},
    },
    nodes: [],
    edges: [],
  };
}

/**
 * Information about an installed protocol for e2e testing.
 */
export type InstalledProtocol = {
  protocolId: string;
  name: string;
  stages: CurrentProtocol['stages'];
  codebook: CurrentProtocol['codebook'];
  assetBasePath: string;
};

/**
 * ProtocolInstaller extracts and installs real .netcanvas protocol files
 * for e2e testing. It:
 *
 * 1. Extracts protocol.json from the ZIP file
 * 2. Copies assets to public/e2e-assets/{protocolId}/
 * 3. Rewrites asset:// URLs to /e2e-assets/{protocolId}/
 * 4. Inserts the protocol into the database via raw SQL
 *
 * This allows e2e tests to use real protocols with full asset support.
 */
export class ProtocolInstaller {
  private databaseUrl: string;
  private publicDir: string;
  private installedProtocols: string[] = [];

  constructor(databaseUrl: string, publicDir: string) {
    this.databaseUrl = databaseUrl;
    this.publicDir = publicDir;
  }

  /**
   * Install a .netcanvas protocol for e2e testing.
   *
   * @param protocolPath - Absolute path to the .netcanvas file
   * @returns Information about the installed protocol
   */
  async install(protocolPath: string): Promise<InstalledProtocol> {
    log('test', `Installing protocol from: ${protocolPath}`);

    // Dynamically import JSZip to match the pattern used in the codebase
    const JSZip = (await import('jszip')).default;

    // Read the protocol file
    const fileBuffer = await fs.readFile(protocolPath);
    const zip = await JSZip.loadAsync(fileBuffer);

    // Extract protocol.json
    const protocolString = await zip.file('protocol.json')?.async('string');
    if (!protocolString) {
      throw new Error('protocol.json not found in zip');
    }

    const protocolJson = JSON.parse(protocolString) as VersionedProtocol;

    // Generate a unique protocol ID
    const protocolId = createId();

    // Create asset directory
    const assetDir = path.join(this.publicDir, 'e2e-assets', protocolId);
    await fs.mkdir(assetDir, { recursive: true });

    // Extract assets
    await this.extractAssets(zip, assetDir);

    // Rewrite asset:// URLs to /e2e-assets/{protocolId}/
    const rewrittenProtocol = this.rewriteAssetUrls(
      protocolJson,
      protocolId,
    ) as CurrentProtocol;

    // Insert into database
    await this.insertProtocol(protocolId, rewrittenProtocol);

    // Track for cleanup
    this.installedProtocols.push(protocolId);

    log('test', `Installed protocol "${rewrittenProtocol.name ?? 'Untitled'}" (${protocolId})`);

    return {
      protocolId,
      name: rewrittenProtocol.name ?? 'Untitled',
      stages: rewrittenProtocol.stages,
      codebook: rewrittenProtocol.codebook,
      assetBasePath: `/e2e-assets/${protocolId}`,
    };
  }

  /**
   * Extract all assets from the ZIP to the target directory.
   */
  private async extractAssets(
    zip: JSZip,
    assetDir: string,
  ): Promise<void> {
    const assetsFolder = zip.folder('assets');
    if (!assetsFolder) {
      log('test', 'No assets folder in protocol');
      return;
    }

    const assetFiles: { name: string; relativePath: string }[] = [];
    assetsFolder.forEach((relativePath, file) => {
      if (!file.dir) {
        assetFiles.push({ name: file.name, relativePath });
      }
    });

    log('test', `Extracting ${assetFiles.length} assets...`);

    for (const { name, relativePath } of assetFiles) {
      const file = zip.file(name);
      if (!file) continue;

      const content = await file.async('nodebuffer');
      const destPath = path.join(assetDir, relativePath);

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content);
    }
  }

  /**
   * Rewrite all asset:// URLs in the protocol to use the e2e assets path.
   */
  private rewriteAssetUrls(
    protocol: VersionedProtocol,
    protocolId: string,
  ): VersionedProtocol {
    const json = JSON.stringify(protocol);
    const rewritten = json.replace(
      /asset:\/\/([^"]+)/g,
      `/e2e-assets/${protocolId}/$1`,
    );
    return JSON.parse(rewritten) as VersionedProtocol;
  }

  /**
   * Insert the protocol into the database.
   */
  private async insertProtocol(
    protocolId: string,
    protocol: CurrentProtocol,
  ): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      const protocolHash = hash(protocol);
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO "Protocol"
         (id, hash, name, "schemaVersion", description, "importedAt", "lastModified", stages, codebook, experiments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          protocolId,
          protocolHash,
          protocol.name ?? 'E2E Test Protocol',
          protocol.schemaVersion,
          protocol.description ?? '',
          now,
          protocol.lastModified ?? now,
          JSON.stringify(protocol.stages),
          JSON.stringify(protocol.codebook),
          protocol.experiments ? JSON.stringify(protocol.experiments) : null,
        ],
      );

      // Insert assets into the Asset table if there are any
      // Asset schema: key (@id), assetId (@unique), name, type, url, size, value?
      if (protocol.assetManifest) {
        for (const [assetId, asset] of Object.entries(protocol.assetManifest)) {
          // Skip apikey assets (they don't have source files)
          if (asset.type === 'apikey') continue;
          if (!('source' in asset)) continue;

          const assetKey = createId(); // Generate unique key for the asset

          await pool.query(
            `INSERT INTO "Asset"
             (key, "assetId", name, type, url, size)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              assetKey,
              assetId,
              asset.name,
              asset.type,
              `/e2e-assets/${protocolId}/${asset.source}`,
              0, // Size unknown from manifest
            ],
          );

          // Link asset to protocol via the implicit many-to-many join table
          // _AssetToProtocol has columns A (Asset.key) and B (Protocol.id)
          await pool.query(
            `INSERT INTO "_AssetToProtocol" ("A", "B")
             VALUES ($1, $2)`,
            [assetKey, protocolId],
          );
        }
      }
    } finally {
      await pool.end();
    }
  }

  /**
   * Create an interview for the given protocol.
   * Also creates a test participant to link the interview to.
   *
   * @param protocolId - The protocol ID to create an interview for
   * @param participantIdentifier - Optional participant identifier (defaults to auto-generated)
   * @returns The interview ID
   */
  async createInterview(
    protocolId: string,
    participantIdentifier?: string,
  ): Promise<string> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      const interviewId = createId();
      const participantId = createId();
      const identifier = participantIdentifier ?? `e2e-participant-${Date.now()}`;
      const now = new Date().toISOString();

      // Create participant first (Interview requires participantId)
      await pool.query(
        `INSERT INTO "Participant" (id, identifier, label)
         VALUES ($1, $2, $3)`,
        [participantId, identifier, `E2E Test Participant`],
      );

      // Create interview linked to participant
      await pool.query(
        `INSERT INTO "Interview"
         (id, "protocolId", "participantId", "currentStep", "startTime", "lastUpdated", network)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          interviewId,
          protocolId,
          participantId,
          0,
          now,
          now,
          JSON.stringify(createInitialNetwork()),
        ],
      );

      log('test', `Created interview ${interviewId} for protocol ${protocolId}`);
      return interviewId;
    } finally {
      await pool.end();
    }
  }

  /**
   * Inject network state directly into an interview.
   * Used to set up starting state for stage group tests.
   *
   * @param interviewId - The interview to update
   * @param network - The network state to inject
   * @param currentStep - The step to set
   */
  async injectNetworkState(
    interviewId: string,
    network: { nodes: unknown[]; edges: unknown[]; ego: unknown },
    currentStep: number,
  ): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      await pool.query(
        `UPDATE "Interview"
         SET network = $1, "currentStep" = $2, "lastUpdated" = $3
         WHERE id = $4`,
        [JSON.stringify(network), currentStep, new Date().toISOString(), interviewId],
      );

      log('test', `Injected network state at step ${currentStep} for interview ${interviewId}`);
    } finally {
      await pool.end();
    }
  }

  /**
   * Uninstall a protocol and clean up its assets.
   *
   * @param protocolId - The protocol ID to uninstall
   */
  async uninstall(protocolId: string): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      // Delete from database (cascades to interviews)
      await pool.query('DELETE FROM "Protocol" WHERE id = $1', [protocolId]);

      // Remove asset directory
      const assetDir = path.join(this.publicDir, 'e2e-assets', protocolId);
      await fs.rm(assetDir, { recursive: true, force: true });

      log('test', `Uninstalled protocol ${protocolId}`);
    } finally {
      await pool.end();
    }
  }

  /**
   * Clean up all installed protocols.
   */
  async cleanup(): Promise<void> {
    for (const protocolId of this.installedProtocols) {
      try {
        await this.uninstall(protocolId);
      } catch (error) {
        log('test', `Failed to cleanup protocol ${protocolId}: ${String(error)}`);
      }
    }
    this.installedProtocols = [];

    // Also clean up the e2e-assets directory
    const assetsDir = path.join(this.publicDir, 'e2e-assets');
    try {
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Get the list of installed protocol IDs.
   */
  getInstalledProtocols(): string[] {
    return [...this.installedProtocols];
  }
}

/**
 * Clean up extracted protocol assets from the public directory.
 * Note: This does NOT delete the source files in tests/e2e/data/ -
 * only the extracted assets in public/e2e-assets/.
 *
 * @param publicDir - Path to the public directory
 */
export async function cleanupExtractedAssets(publicDir: string): Promise<void> {
  const assetsDir = path.join(publicDir, 'e2e-assets');

  try {
    await fs.rm(assetsDir, { recursive: true, force: true });
    log('teardown', 'Cleaned up extracted e2e assets');
  } catch (error) {
    // Ignore if doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      log('teardown', `Failed to cleanup e2e assets: ${String(error)}`);
    }
  }
}

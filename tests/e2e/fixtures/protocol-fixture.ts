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
import { log } from '../helpers/logger.js';

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

export type InstalledProtocol = {
  protocolId: string;
  name: string;
  stages: CurrentProtocol['stages'];
  codebook: CurrentProtocol['codebook'];
  assetBasePath: string;
};

/**
 * ProtocolFixture extracts and installs real .netcanvas protocol files
 * for e2e testing. It:
 *
 * 1. Extracts protocol.json from the ZIP file
 * 2. Copies assets to public/e2e-assets/{protocolId}/
 * 3. Rewrites asset:// URLs to /e2e-assets/{protocolId}/
 * 4. Inserts the protocol into the database via raw SQL
 */
export class ProtocolFixture {
  private databaseUrl: string;
  private publicDir: string;
  private installedProtocols: string[] = [];

  constructor(databaseUrl: string) {
    const projectRoot = path.resolve(import.meta.dirname, '../../../');
    this.databaseUrl = databaseUrl;
    this.publicDir = path.join(projectRoot, '.next/standalone/public');
  }

  async install(protocolPath: string): Promise<InstalledProtocol> {
    log('test', `Installing protocol from: ${protocolPath}`);

    const JSZip = (await import('jszip')).default;

    const fileBuffer = await fs.readFile(protocolPath);
    const zip = await JSZip.loadAsync(fileBuffer);

    const protocolString = await zip.file('protocol.json')?.async('string');
    if (!protocolString) {
      throw new Error('protocol.json not found in zip');
    }

    const protocolJson = JSON.parse(protocolString) as VersionedProtocol;

    const protocolId = createId();

    const assetDir = path.join(this.publicDir, 'e2e-assets', protocolId);
    await fs.mkdir(assetDir, { recursive: true });

    await this.extractAssets(zip, assetDir);

    const rewrittenProtocol = this.rewriteAssetUrls(
      protocolJson,
      protocolId,
    ) as CurrentProtocol;

    await this.insertProtocol(protocolId, rewrittenProtocol);

    this.installedProtocols.push(protocolId);

    log(
      'test',
      `Installed protocol "${rewrittenProtocol.name ?? 'Untitled'}" (${protocolId})`,
    );

    return {
      protocolId,
      name: rewrittenProtocol.name ?? 'Untitled',
      stages: rewrittenProtocol.stages,
      codebook: rewrittenProtocol.codebook,
      assetBasePath: `/e2e-assets/${protocolId}`,
    };
  }

  private async extractAssets(zip: JSZip, assetDir: string): Promise<void> {
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

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content);
    }
  }

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

      if (protocol.assetManifest) {
        for (const [assetId, asset] of Object.entries(protocol.assetManifest)) {
          if (asset.type === 'apikey') continue;
          if (!('source' in asset)) continue;

          const assetKey = createId();

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
              0,
            ],
          );

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

  async createInterview(
    protocolId: string,
    participantIdentifier?: string,
  ): Promise<string> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      const interviewId = createId();
      const participantId = createId();
      const identifier =
        participantIdentifier ?? `e2e-participant-${Date.now()}`;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO "Participant" (id, identifier, label)
         VALUES ($1, $2, $3)`,
        [participantId, identifier, `E2E Test Participant`],
      );

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

      log(
        'test',
        `Created interview ${interviewId} for protocol ${protocolId}`,
      );
      return interviewId;
    } finally {
      await pool.end();
    }
  }

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
        [
          JSON.stringify(network),
          currentStep,
          new Date().toISOString(),
          interviewId,
        ],
      );

      log(
        'test',
        `Injected network state at step ${currentStep} for interview ${interviewId}`,
      );
    } finally {
      await pool.end();
    }
  }

  async uninstall(protocolId: string): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });

    try {
      await pool.query('DELETE FROM "Protocol" WHERE id = $1', [protocolId]);

      const assetDir = path.join(this.publicDir, 'e2e-assets', protocolId);
      await fs.rm(assetDir, { recursive: true, force: true });

      log('test', `Uninstalled protocol ${protocolId}`);
    } finally {
      await pool.end();
    }
  }

  async cleanup(): Promise<void> {
    for (const protocolId of this.installedProtocols) {
      try {
        await this.uninstall(protocolId);
      } catch (error) {
        log(
          'test',
          `Failed to cleanup protocol ${protocolId}: ${String(error)}`,
        );
      }
    }
    this.installedProtocols = [];

    const assetsDir = path.join(this.publicDir, 'e2e-assets');
    try {
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }

  getInstalledProtocols(): string[] {
    return [...this.installedProtocols];
  }
}

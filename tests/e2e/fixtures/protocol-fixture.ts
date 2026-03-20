import {
  type Codebook,
  type CurrentProtocol,
  type VersionedProtocol,
} from '@codaco/protocol-validation';
import { createId } from '@paralleldrive/cuid2';
import type JSZip from 'jszip';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { hash } from 'ohash';
import { type Prisma } from '~/lib/db/generated/client';
import { log } from '../helpers/logger.js';
import { type TestPrismaClient } from '../helpers/prisma.js';

/**
 * Creates an initial empty network for a new interview.
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
 * Rewrites asset:// URLs to serve from the asset server.
 */
function rewriteAssetUrls<T>(
  protocol: T,
  protocolId: string,
  assetServerUrl: string,
): T {
  const json = JSON.stringify(protocol);
  const rewritten = json.replace(
    /asset:\/\/([^"]+)/g,
    `${assetServerUrl}/${protocolId}/$1`,
  );
  return JSON.parse(rewritten) as T;
}

type InstalledProtocol = {
  protocolId: string;
  name: string;
  stages: CurrentProtocol['stages'];
  codebook: Codebook;
  assetBasePath: string;
};

/**
 * ProtocolFixture extracts and installs real .netcanvas protocol files
 * for e2e testing. It:
 *
 * 1. Extracts protocol.json from the ZIP file
 * 2. Copies assets to .e2e-assets/{protocolId}/ (served by asset server)
 * 3. Rewrites asset:// URLs to {assetServerUrl}/{protocolId}/
 * 4. Inserts the protocol into the database via Prisma
 */
export class ProtocolFixture {
  private prisma: TestPrismaClient;
  private assetDir: string;
  private assetServerUrl: string;
  private installedProtocols: string[] = [];

  constructor(prisma: TestPrismaClient, assetServerUrl: string) {
    const projectRoot = path.resolve(import.meta.dirname, '../../../');
    this.prisma = prisma;
    this.assetServerUrl = assetServerUrl;
    // Assets are stored in .e2e-assets at project root (served by asset server)
    this.assetDir = path.join(projectRoot, '.e2e-assets');
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

    const protocolAssetDir = path.join(this.assetDir, protocolId);
    await fs.mkdir(protocolAssetDir, { recursive: true });

    await this.extractAssets(zip, protocolAssetDir);

    const rewrittenProtocol = rewriteAssetUrls(
      protocolJson,
      protocolId,
      this.assetServerUrl,
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
      assetBasePath: `${this.assetServerUrl}/${protocolId}`,
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

  private async insertProtocol(
    protocolId: string,
    protocol: CurrentProtocol,
  ): Promise<void> {
    const protocolHash = hash(protocol);
    const now = new Date();

    await this.prisma.protocol.create({
      data: {
        id: protocolId,
        hash: protocolHash,
        name: protocol.name ?? 'E2E Test Protocol',
        schemaVersion: protocol.schemaVersion,
        description: protocol.description ?? '',
        importedAt: now,
        lastModified: protocol.lastModified
          ? new Date(protocol.lastModified)
          : now,
        stages: protocol.stages as Prisma.InputJsonValue,
        codebook: protocol.codebook as Prisma.InputJsonValue,
        experiments: protocol.experiments
          ? (protocol.experiments as Prisma.InputJsonValue)
          : undefined,
      },
    });

    if (protocol.assetManifest) {
      for (const [assetId, asset] of Object.entries(protocol.assetManifest)) {
        if (asset.type === 'apikey') continue;
        if (!('source' in asset)) continue;

        await this.prisma.asset.create({
          data: {
            key: createId(),
            assetId,
            name: asset.name,
            type: asset.type,
            url: `${this.assetServerUrl}/${protocolId}/${asset.source}`,
            size: 0,
            protocols: { connect: { id: protocolId } },
          },
        });
      }
    }
  }

  async createInterview(
    protocolId: string,
    participantIdentifier?: string,
  ): Promise<string> {
    const identifier = participantIdentifier ?? `e2e-participant-${Date.now()}`;

    const participant = await this.prisma.participant.create({
      data: {
        id: createId(),
        identifier,
        label: 'E2E Test Participant',
      },
    });

    const interview = await this.prisma.interview.create({
      data: {
        id: createId(),
        protocolId,
        participantId: participant.id,
        currentStep: 0,
        network: createInitialNetwork() as Prisma.InputJsonValue,
      },
    });

    log('test', `Created interview ${interview.id} for protocol ${protocolId}`);
    return interview.id;
  }

  /**
   * Get the current network state from the database for an interview.
   * Useful for debugging sync issues.
   */
  async getNetworkState(interviewId: string): Promise<{
    nodes: { _uid: string; type: string; attributes: Record<string, unknown> }[];
    edges: { _uid: string; type: string; from: string; to: string }[];
    ego: { _uid: string; attributes: Record<string, unknown> };
    currentStep: number;
  }> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: { network: true, currentStep: true },
    });

    if (!interview) {
      throw new Error(`Interview ${interviewId} not found`);
    }

    const network = interview.network as {
      nodes: { _uid: string; type: string; attributes: Record<string, unknown> }[];
      edges: { _uid: string; type: string; from: string; to: string }[];
      ego: { _uid: string; attributes: Record<string, unknown> };
    };

    return {
      ...network,
      currentStep: interview.currentStep,
    };
  }

  /**
   * Wait for nodes to appear in the database.
   * Polls the database until the expected number of nodes exist or timeout.
   */
  async waitForNodes(
    interviewId: string,
    expectedCount: number,
    options: { timeout?: number; interval?: number } = {},
  ): Promise<void> {
    const { timeout = 10000, interval = 500 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const state = await this.getNetworkState(interviewId);
      if (state.nodes.length >= expectedCount) {
        log('test', `Found ${state.nodes.length} nodes in database`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    const finalState = await this.getNetworkState(interviewId);
    throw new Error(
      `Timeout waiting for ${expectedCount} nodes. Found ${finalState.nodes.length} nodes after ${timeout}ms`,
    );
  }

  /**
   * Log the current network state for debugging.
   */
  async logNetworkState(interviewId: string): Promise<void> {
    const state = await this.getNetworkState(interviewId);
    log('test', `Network state for interview ${interviewId}:`);
    log('test', `  Current step: ${state.currentStep}`);
    log('test', `  Nodes (${state.nodes.length}):`);
    for (const node of state.nodes) {
      log('test', `    - ${node._uid}: ${JSON.stringify(node.attributes)}`);
    }
    log('test', `  Edges (${state.edges.length}):`);
    for (const edge of state.edges) {
      log('test', `    - ${edge.from} -> ${edge.to} (${edge.type})`);
    }
  }

  async uninstall(protocolId: string): Promise<void> {
    await this.prisma.protocol.delete({
      where: { id: protocolId },
    });

    const protocolAssetDir = path.join(this.assetDir, protocolId);
    await fs.rm(protocolAssetDir, { recursive: true, force: true });

    log('test', `Uninstalled protocol ${protocolId}`);
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
  }
}

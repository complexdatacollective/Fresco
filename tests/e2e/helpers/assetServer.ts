import { createServer, type Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import { join, extname } from 'node:path';
import { log } from './logger.js';

const MIME_TYPES: Record<string, string> = {
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  // Data
  '.json': 'application/json',
  '.csv': 'text/csv',
};

/**
 * Simple HTTP server for serving protocol assets during E2E tests.
 *
 * Next.js standalone mode pre-computes the public directory at build time,
 * so files added after build are not served. This asset server provides
 * a workaround by serving files from a dedicated directory at runtime.
 */
export class AssetServer {
  private server: Server;
  private port: number;
  private assetDir: string;
  url: string;

  private constructor(server: Server, port: number, assetDir: string) {
    this.server = server;
    this.port = port;
    this.assetDir = assetDir;
    this.url = `http://localhost:${port}`;
  }

  static async start(assetDir: string, port: number): Promise<AssetServer> {
    // Ensure asset directory exists
    await fs.mkdir(assetDir, { recursive: true });

    const server = createServer((req, res) => {
      // Add CORS headers for cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
      }

      const urlPath = decodeURIComponent(
        new URL(req.url ?? '/', 'http://localhost').pathname,
      );
      const filePath = join(assetDir, urlPath);

      try {
        const stat = statSync(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Cache-Control': 'no-cache',
        });

        createReadStream(filePath).pipe(res);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not found: ${urlPath}`);
      }
    });

    return new Promise((resolve, reject) => {
      server.on('error', reject);
      server.listen(port, () => {
        const assetServer = new AssetServer(server, port, assetDir);
        log('setup', `Asset server started at ${assetServer.url}`);
        resolve(assetServer);
      });
    });
  }

  async stop(): Promise<void> {
    log('teardown', `Stopping asset server on port ${this.port}...`);
    return new Promise((resolve) => {
      this.server.close(() => {
        log('teardown', `Asset server on port ${this.port} stopped`);
        resolve();
      });
    });
  }

  /**
   * Clean up all assets in the asset directory.
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.assetDir, { recursive: true, force: true });
      await fs.mkdir(this.assetDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get the full URL for an asset path.
   */
  getAssetUrl(assetPath: string): string {
    return `${this.url}/${assetPath}`;
  }
}

// Fixed port for asset server (outside the range used by app servers)
export const ASSET_SERVER_PORT = 4200;

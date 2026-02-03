import type { Protocol, Asset } from '~/lib/db/generated/client';
import { offlineDb, type CachedAsset } from './db';

export type DownloadProgress = {
  protocolId: string;
  totalAssets: number;
  downloadedAssets: number;
  totalBytes: number;
  downloadedBytes: number;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  error: string | null;
};

type AssetManifestItem = {
  key: string;
  assetId: string;
  url: string;
  type: string;
};

type ProgressListener = (progress: DownloadProgress) => void;

export type ProtocolWithAssets = Protocol & {
  assets: Asset[];
};

export class AssetDownloadManager {
  private abortController: AbortController | null = null;
  private currentProgress: DownloadProgress | null = null;
  private progressListeners = new Set<ProgressListener>();

  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifyProgress(progress: DownloadProgress): void {
    this.currentProgress = progress;
    this.progressListeners.forEach((listener) => listener(progress));
  }

  async checkStorageQuota(): Promise<{
    available: number;
    used: number;
    total: number;
    percentUsed: number;
  }> {
    if (!navigator.storage?.estimate) {
      return { available: 0, used: 0, total: 0, percentUsed: 0 };
    }

    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const total = estimate.quota ?? 0;
    const available = total - used;
    const percentUsed = total > 0 ? (used / total) * 100 : 0;

    return { available, used, total, percentUsed };
  }

  extractAssetManifest(protocol: ProtocolWithAssets): AssetManifestItem[] {
    const assets: AssetManifestItem[] = [];
    const seenAssetIds = new Set<string>();

    if (!Array.isArray(protocol.assets)) {
      return assets;
    }

    for (const asset of protocol.assets) {
      if (
        !asset ||
        typeof asset !== 'object' ||
        !('key' in asset) ||
        !('assetId' in asset) ||
        !('url' in asset)
      ) {
        continue;
      }

      const assetData = asset as Record<string, unknown>;
      const key = assetData.key;
      const assetId = assetData.assetId;
      const url = assetData.url;
      const type = assetData.type;

      if (
        typeof key === 'string' &&
        typeof assetId === 'string' &&
        typeof url === 'string' &&
        typeof type === 'string' &&
        !seenAssetIds.has(assetId)
      ) {
        seenAssetIds.add(assetId);
        assets.push({ key, assetId, url, type });
      }
    }

    return assets;
  }

  private async downloadAsset(
    asset: AssetManifestItem,
    signal: AbortSignal,
  ): Promise<{ blob: Blob }> {
    const response = await fetch(asset.url, { signal });

    if (!response.ok) {
      throw new Error(
        `Failed to download asset ${asset.assetId}: ${response.status} ${response.statusText}`,
      );
    }

    const blob = await response.blob();

    return { blob };
  }

  async downloadProtocolAssets(
    protocol: ProtocolWithAssets,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<{ success: boolean; error: string | null }> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const assets = this.extractAssetManifest(protocol);

    if (assets.length === 0) {
      const progress: DownloadProgress = {
        protocolId: protocol.id,
        totalAssets: 0,
        downloadedAssets: 0,
        totalBytes: 0,
        downloadedBytes: 0,
        status: 'completed',
        error: null,
      };
      this.notifyProgress(progress);
      onProgress?.(progress);
      return { success: true, error: null };
    }

    const totalAssets = assets.length;
    let downloadedAssets = 0;
    let downloadedBytes = 0;
    let totalBytes = 0;

    const initialProgress: DownloadProgress = {
      protocolId: protocol.id,
      totalAssets,
      downloadedAssets: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      status: 'downloading',
      error: null,
    };
    this.notifyProgress(initialProgress);
    onProgress?.(initialProgress);

    try {
      for (const asset of assets) {
        if (signal.aborted) {
          const pausedProgress: DownloadProgress = {
            protocolId: protocol.id,
            totalAssets,
            downloadedAssets,
            totalBytes,
            downloadedBytes,
            status: 'paused',
            error: null,
          };
          this.notifyProgress(pausedProgress);
          onProgress?.(pausedProgress);
          return { success: false, error: 'Download paused' };
        }

        const existingAsset = await offlineDb.assets
          .where('assetId')
          .equals(asset.assetId)
          .first();

        if (existingAsset) {
          downloadedAssets++;
          const progress: DownloadProgress = {
            protocolId: protocol.id,
            totalAssets,
            downloadedAssets,
            totalBytes,
            downloadedBytes,
            status: 'downloading',
            error: null,
          };
          this.notifyProgress(progress);
          onProgress?.(progress);
          continue;
        }

        const { blob } = await this.downloadAsset(asset, signal);

        const cachedAsset: CachedAsset = {
          key: asset.key,
          assetId: asset.assetId,
          protocolId: protocol.id,
          cachedAt: Date.now(),
          blob,
        };

        await offlineDb.assets.put(cachedAsset);

        downloadedBytes += blob.size;
        totalBytes += blob.size;
        downloadedAssets++;

        const progress: DownloadProgress = {
          protocolId: protocol.id,
          totalAssets,
          downloadedAssets,
          totalBytes,
          downloadedBytes,
          status: 'downloading',
          error: null,
        };
        this.notifyProgress(progress);
        onProgress?.(progress);
      }

      const completedProgress: DownloadProgress = {
        protocolId: protocol.id,
        totalAssets,
        downloadedAssets,
        totalBytes,
        downloadedBytes,
        status: 'completed',
        error: null,
      };
      this.notifyProgress(completedProgress);
      onProgress?.(completedProgress);

      return { success: true, error: null };
    } catch (error) {
      await this.cleanupPartialDownload(protocol.id);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      const errorProgress: DownloadProgress = {
        protocolId: protocol.id,
        totalAssets,
        downloadedAssets,
        totalBytes,
        downloadedBytes,
        status: 'error',
        error: errorMessage,
      };
      this.notifyProgress(errorProgress);
      onProgress?.(errorProgress);

      return { success: false, error: errorMessage };
    } finally {
      this.abortController = null;
    }
  }

  pauseDownload(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  resumeDownload(): void {
    throw new Error(
      'Resume not implemented - please restart the download from the beginning',
    );
  }

  private async cleanupPartialDownload(protocolId: string): Promise<void> {
    try {
      await offlineDb.assets.where('protocolId').equals(protocolId).delete();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to cleanup partial download:', error);
    }
  }

  getCurrentProgress(): DownloadProgress | null {
    return this.currentProgress;
  }
}

export const assetDownloadManager = new AssetDownloadManager();

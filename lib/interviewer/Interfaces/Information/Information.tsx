import { type Item } from '@codaco/protocol-validation';
import React, { useState } from 'react';
import Surface from '~/components/layout/Surface';
import {
  ALLOWED_MARKDOWN_SECTION_TAGS,
  RenderMarkdown,
} from '~/components/RenderMarkdown';
import Spinner from '~/components/Spinner';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { useContractFlags } from '~/lib/interviewer/contract/context';
import { type StageProps } from '~/lib/interviewer/types';
import { cx } from '~/utils/cva';
import AssetMetaProvider from '../utils/AssetMetaProvider';

// UploadThing's CDN serves files uploaded via the `blob` router with an invalid
// Content-Type (e.g. `video` instead of `video/mp4`). Safari strictly requires
// a valid MIME type and refuses to play otherwise. We work around this by
// providing an explicit `type` on the `<source>` element, derived from the
// original filename extension stored in the asset record.
const MEDIA_MIME_TYPES: Record<string, string> = {
  // Video
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  // Many .mov files contain codecs such as H.264 or HEVC, but browser
  // support varies by codec, browser, and platform. We use video/mp4
  // instead of video/quicktime because Chrome rejects the latter even
  // when it can decode the underlying codec.
  '.mov': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.ogv': 'video/ogg',
  // Audio (.ogg is audio-only; video ogg files use the .ogv extension above)
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
};

function getMediaMimeType(
  filename: string | undefined,
  fallback: string,
): string {
  if (!filename) return fallback;
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return fallback;
  const ext = filename.slice(dotIndex).toLowerCase();
  return MEDIA_MIME_TYPES[ext] ?? fallback;
}

type MediaLoadState = 'loading' | 'loaded' | 'error';

function VideoPlayer({
  src,
  name,
  isE2E,
}: {
  src: string;
  name: string;
  isE2E: boolean;
}) {
  const [state, setState] = useState<MediaLoadState>('loading');

  // Disable autoPlay and preload to prevent browser crashes in headless E2E tests.
  const mimeType = getMediaMimeType(name, 'video/mp4');

  return (
    <div className={cx('relative', state === 'loading' && 'min-h-48')}>
      {state === 'loading' && !isE2E && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Spinner size="lg" />
          <Paragraph intent="smallText">Loading video...</Paragraph>
        </div>
      )}
      {state === 'error' && (
        <Paragraph intent="smallText" className="text-center">
          Video could not be loaded.
        </Paragraph>
      )}
      <video
        loop
        controls
        autoPlay={!isE2E}
        muted={!isE2E}
        playsInline
        preload={isE2E ? 'none' : 'auto'}
        className={cx(
          (state === 'loading' && !isE2E) || state === 'error'
            ? 'invisible h-0'
            : '',
        )}
        onLoadedData={() => setState('loaded')}
        onError={() => setState('error')}
      >
        <source src={src} type={mimeType} />
      </video>
    </div>
  );
}

const getItemComponent = (item: Item, isE2E: boolean) => {
  switch (item.type) {
    case 'text':
      return (
        <RenderMarkdown allowedElements={ALLOWED_MARKDOWN_SECTION_TAGS}>
          {item.content}
        </RenderMarkdown>
      );
    case 'asset':
      return (
        <AssetMetaProvider assetId={item.content}>
          {(assetMeta) => {
            switch (assetMeta.type) {
              case 'image':
                return (
                  <img
                    src={assetMeta.url}
                    alt={item.description ?? ''}
                    className={cx(
                      'size-full object-contain',
                      item.size === 'SMALL' && 'max-h-48',
                      item.size === 'MEDIUM' && 'max-h-96',
                      item.size === 'LARGE' && 'max-h-[60vh]',
                    )}
                  />
                );
              case 'audio':
                return (
                  <audio controls autoPlay>
                    <source
                      src={assetMeta.url}
                      type={getMediaMimeType(assetMeta.name, 'audio/mpeg')}
                    />
                  </audio>
                );
              case 'video':
                return (
                  <VideoPlayer
                    src={assetMeta.url}
                    name={assetMeta.name}
                    isE2E={isE2E}
                  />
                );
              default:
                return null;
            }
          }}
        </AssetMetaProvider>
      );
  }
};

type InformationProps = StageProps<'Information'>;

/**
 * Information Interface
 */
const Information = ({ stage: { title, items } }: InformationProps) => {
  const { isE2E } = useContractFlags();

  return (
    <ScrollArea className="m-0 size-full">
      <div className="interface allow-text-selection mx-auto flex min-h-full max-w-[80ch] flex-col justify-center">
        <Surface className="grow-0" noContainer>
          <Heading level="h1" className="text-center">
            {title}
          </Heading>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {getItemComponent(item, isE2E)}
            </React.Fragment>
          ))}
        </Surface>
      </div>
    </ScrollArea>
  );
};

export default Information;

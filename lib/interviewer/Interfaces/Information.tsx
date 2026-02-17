import { type Item, type Stage } from '@codaco/protocol-validation';
import React from 'react';
import Surface from '~/components/layout/Surface';
import {
  ALLOWED_MARKDOWN_SECTION_TAGS,
  RenderMarkdown,
} from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx } from '~/utils/cva';
import { type StageProps } from '../components/Stage';
import AssetMetaProvider from './utils/AssetMetaProvider';

const getItemComponent = (item: Item) => {
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
                return <audio src={assetMeta.url} controls autoPlay />;
              case 'video':
                return (
                  <video
                    src={assetMeta.url}
                    loop={item.loop}
                    autoPlay
                    playsInline
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

type InformationStage = Extract<Stage, { type: 'Information' }>;

type InformationProps = StageProps & {
  stage: InformationStage;
};

/**
 * Information Interface
 */
const Information = ({ stage: { title, items } }: InformationProps) => {
  return (
    <ScrollArea className="m-0 size-full">
      <div className="interface allow-text-selection mx-auto flex min-h-full max-w-[80ch] flex-col justify-center">
        <Surface className="grow-0" noContainer>
          <Heading level="h1" className="text-center">
            {title}
          </Heading>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {getItemComponent(item)}
            </React.Fragment>
          ))}
        </Surface>
      </div>
    </ScrollArea>
  );
};

export default Information;

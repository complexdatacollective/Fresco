import cx from 'classnames';
import PropTypes from 'prop-types';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import Scroller from '~/lib/legacy-ui/components/Scroller';
import { ALLOWED_MARKDOWN_TAGS } from '~/lib/legacy-ui/utils/config';
import AssetMetaProvider from '../behaviours/AssetMetaProvider';
import Audio from '../components/Audio';
import BackgroundImage from '../components/BackgroundImage';
import Video from '../components/Video';

const getAssetComponent = (asset) => {
  switch (asset.type) {
    case 'image':
      return (
        <BackgroundImage
          url={asset.url}
          className="information-interface__background-image"
        />
      );
    case 'audio':
      return <Audio url={asset.url} controls autoPlay />;
    case 'video':
      return <Video url={asset.url} loop={asset.loop} autoPlay />;
    default:
      return null;
  }
};

const getItemComponent = (item) => {
  switch (item.type) {
    case 'text':
      return (
        <RenderMarkdown
          allowedElements={[...ALLOWED_MARKDOWN_TAGS, 'a']} // Allow anchor tags only for the information interface
        >
          {item.content}
        </RenderMarkdown>
      );
    case 'asset':
      return (
        <AssetMetaProvider assetId={item.content}>
          {(assetMeta) => getAssetComponent({ ...item, ...assetMeta })}
        </AssetMetaProvider>
      );

    default:
      return null;
  }
};

const renderItem = (item, index) => {
  const itemClasses = cx(
    'information-interface__item',
    `information-interface__item--type-${item.type}`,
    `information-interface__item--size-${item.size}`,
  );

  return (
    <div className={itemClasses} key={index}>
      {getItemComponent(item)}
    </div>
  );
};

const renderItems = (items) => (items ? items.map(renderItem) : null);

/**
 * Information Interface
 */
const Information = ({ stage: { title, items } }) => {
  return (
    <div className="interface allow-text-selection">
      <Scroller className="information-interface__information-container-scroller">
        <div className="information-interface">
          <div className="information-interface__frame">
            <Heading level="h2" className="text-center">
              {title}
            </Heading>
            <div className="information-interface__items">
              {renderItems(items)}
            </div>
          </div>
        </div>
      </Scroller>
    </div>
  );
};

Information.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default Information;

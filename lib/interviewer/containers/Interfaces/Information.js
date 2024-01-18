import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Markdown from '~/lib/ui/components/Fields/Markdown';
import Audio from '../../components/Audio';
import BackgroundImage from '../../components/BackgroundImage';
import Video from '../../components/Video';
import { InformationContentType, AssetType } from '../../protocol-consts';
import AssetMetaProvider from '../../behaviours/AssetMetaProvider';
import Scroller from '~/lib/ui/components/Scroller';

const getAssetComponent = (asset) => {
  switch (asset.type) {
    case AssetType.image:
      return (
        <BackgroundImage
          url={asset.url}
          className="information-interface__background-image"
        />
      );
    case AssetType.audio:
      return <Audio url={asset.url} controls autoPlay />;
    case AssetType.video:
      return <Video url={asset.url} loop={asset.loop} autoPlay />;
    default:
      return null;
  }
};

const getItemComponent = (item) => {
  switch (item.type) {
    case InformationContentType.text:
      return <Markdown label={item.content} />;
    case InformationContentType.asset:
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
    <div className="interface">
      <Scroller>
        <div className="information-interface">
          <div className="information-interface__frame">
            <h1 className="information-interface__title type--title-1">
              {title}
            </h1>
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

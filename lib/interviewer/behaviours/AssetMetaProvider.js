import { useSelector } from 'react-redux';
import { getAssetManifest } from '../ducks/modules/protocol';

const AssetMetaProvider = ({ children, assetId }) => {
  const codebookAssets = useSelector(getAssetManifest);

  const asset = codebookAssets[assetId];

  if (!codebookAssets) {
    return null;
  }

  return children(asset);
};

export default AssetMetaProvider;

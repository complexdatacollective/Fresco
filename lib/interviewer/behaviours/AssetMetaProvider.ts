import { useSelector } from 'react-redux';
import { getAssetManifest } from '../ducks/modules/protocol';

const AssetMetaProvider = ({
  children,
  assetId,
}: {
  children: (asset: unknown) => React.ReactNode;
  assetId: string;
}) => {
  const codebookAssets = useSelector(getAssetManifest);

  const asset = codebookAssets[assetId];

  if (!codebookAssets) {
    // eslint-disable-next-line no-console
    console.log('error loading asset!', assetId);
    return null;
  }

  return children(asset);
};

export default AssetMetaProvider;

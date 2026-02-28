import { useSelector } from 'react-redux';
import { type Asset } from '~/lib/db/generated/browser';
import { getAssetManifest } from '../../ducks/modules/protocol';

const AssetMetaProvider = ({
  children,
  assetId,
}: {
  children: (asset: Asset) => React.ReactNode;
  assetId: string;
}) => {
  const codebookAssets = useSelector(getAssetManifest);

  const asset = codebookAssets[assetId];

  if (!codebookAssets || !asset) {
    // eslint-disable-next-line no-console
    console.log('error loading asset!', assetId);
    return null;
  }

  return children(asset);
};

export default AssetMetaProvider;

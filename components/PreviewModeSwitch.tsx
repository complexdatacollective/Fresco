import { setAppSetting } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from '~/components/SwitchWithOptimisticUpdate';
import { env } from '~/env';
import { getPreviewMode } from '~/queries/appSettings';

const PreviewModeSwitch = async () => {
  const previewMode = await getPreviewMode();
  const readOnly = env.PREVIEW_MODE !== undefined;
  return (
    <SwitchWithOptimisticUpdate
      readOnly={readOnly}
      initialValue={previewMode}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('previewMode', value);
        return value;
      }}
    />
  );
};

export default PreviewModeSwitch;

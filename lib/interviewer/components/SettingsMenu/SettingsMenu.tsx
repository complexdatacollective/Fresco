// import NavigationButton from '../Navigation';
import { SettingsIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';

import { actionCreators as deviceSettingsActions } from '~/lib/interviewer/ducks/modules/deviceSettings';
import { Switch as SwitchUI } from '~/components/ui/switch';
import { useDispatch, useSelector } from 'react-redux';

type SettingsMenuState = {
  deviceSettings: {
    enableExperimentalSounds: boolean;
  };
};

export const SettingsMenu = () => {
  const dispatch = useDispatch();
  const enableExperimentalSounds: boolean = useSelector(
    (state: SettingsMenuState) => state.deviceSettings.enableExperimentalSounds,
  );

  const toggleExperimentalSounds = () => {
    dispatch(deviceSettingsActions.toggleSetting('enableExperimentalSounds'));
  };

  return (
    <Sheet key={'left'}>
      <SheetTrigger>
        {/* <NavigationButton> */}
        <SettingsIcon className="h-[2.4rem] w-[2.4rem]" />
        {/* </NavigationButton> */}
      </SheetTrigger>
      <SheetContent
        side={'left'}
        className="w-[600px] sm:w-[600px] sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle>Interview Settings</SheetTitle>
          <SheetDescription>
            <SwitchUI
              name="allowAnonymousRecruitment"
              checked={enableExperimentalSounds}
              onCheckedChange={toggleExperimentalSounds}
            />
            <div>
              <p className="text-md font-bold">
                Use experimental interaction sounds?
              </p>
              <p className="text-sm">
                This feature adds interaction sounds to common actions in the
                app, which may improve the interview experience. These sounds
                were developed by our summer intern, Anika Wilsnack.
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

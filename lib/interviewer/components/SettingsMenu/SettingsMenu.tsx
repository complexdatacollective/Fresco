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
    <Sheet>
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
            <div className="mt-4 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="mr-4">
                <p className="font-bold">
                  Use experimental interaction sounds?
                </p>
                <p className="text-sm">
                  This feature adds interaction sounds to common actions in the
                  app, which may improve the interview experience. These sounds
                  were developed by our summer intern, Anika Wilsnack.
                </p>
              </div>
              <SwitchUI
                name="allowAnonymousRecruitment"
                checked={enableExperimentalSounds}
                onCheckedChange={toggleExperimentalSounds}
              />
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

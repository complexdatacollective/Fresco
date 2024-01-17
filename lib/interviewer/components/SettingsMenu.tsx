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
        <SettingsIcon className="m-4 h-[2.4rem] w-[2.4rem]" />
      </SheetTrigger>
      <SheetContent
        side={'left'}
        className="w-[600px] border-none	bg-[#2D2955] text-white sm:w-[600px] sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle className="text-xl text-white">
            Interview Settings
          </SheetTitle>
          <SheetDescription>
            <div className="mt-4 flex flex-row items-center justify-between rounded-lg  bg-[#3A3A75] p-3 pl-6 pr-6 shadow-sm">
              <div className="mr-4">
                <p className="text-lg font-bold text-white">
                  Use experimental interaction sounds?
                </p>
                <p className="text-sm font-light text-white">
                  This feature adds interaction sounds to common actions in the
                  app, which may improve the interview experience. These sounds
                  were developed by our summer intern, Anika Wilsnack.
                </p>
              </div>
              <SwitchUI
                name="allowAnonymousRecruitment"
                checked={enableExperimentalSounds}
                onCheckedChange={toggleExperimentalSounds}
                className="data-[state=checked]:bg-[#00C9A2] data-[state=unchecked]:bg-[#2D2955]"
              />
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

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

import ToggleSetting from './ToggleSetting';
import InterfaceScale from './InterfaceScale';

export const SettingsMenu = () => {
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
            <ToggleSetting
              initialSetting={false}
              toggleSettingFunction={() => Promise.resolve()}
              title="Use experimental interaction sounds?"
              description="This feature adds interaction sounds to common actions in the app, which
              may improve the interview experience."
            />
            <InterfaceScale />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

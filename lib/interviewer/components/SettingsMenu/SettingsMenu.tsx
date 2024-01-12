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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

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
            <Tabs defaultValue="visual" className="w-full">
              <TabsList>
                <TabsTrigger value="visual">Visual Preferences</TabsTrigger>
                <TabsTrigger value="audio">Audio Preferences</TabsTrigger>
              </TabsList>
              <TabsContent value="visual">
                <ToggleSetting
                  initialSetting={true}
                  toggleSettingFunction={() => Promise.resolve()}
                  title="Use Dynamic Scaling?"
                  description="Dynamic Scaling lets Interviewer resize the user interface proportionally to the size of the window. Turning it off will use a fixed size."
                />
                <ToggleSetting
                  initialSetting={true}
                  toggleSettingFunction={() => Promise.resolve()}
                  title="Run Fullscreen?"
                  description="Interviewer is designed to run in full screen mode for an
              immersive experience. You may disable or enable this mode here."
                />
                <ToggleSetting
                  initialSetting={true}
                  toggleSettingFunction={() => Promise.resolve()}
                  title="Use fullscreen forms?"
                  description="The full screen node form is optimized for smaller devices, or devices with
              no physical keyboard."
                />
                <ToggleSetting
                  initialSetting={false}
                  toggleSettingFunction={() => Promise.resolve()}
                  title="Use experimental interaction sounds?"
                  description="This feature adds interaction sounds to common actions in the app, which
              may improve the interview experience."
                />
              </TabsContent>
              <TabsContent value="audio">
                <InterfaceScale />
              </TabsContent>
            </Tabs>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

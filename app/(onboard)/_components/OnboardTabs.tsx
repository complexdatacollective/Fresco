'use client';

import SignInForm from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';

export const OnboardTabs = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

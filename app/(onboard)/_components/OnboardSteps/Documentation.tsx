import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { FileText, MonitorPlay } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { updateSetupMetadata } from '~/app/actions';
import { useRouter } from 'next/navigation';

function Documentation() {
  const router = useRouter();

  const handleFinishOnboarding = async () => {
    await updateSetupMetadata();
    router.replace('/dashboard');
  };
  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p>Learn more about Fresco</p>
      </div>
      <Card className="mb-2">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <MonitorPlay size={30} className="mr-2" />
            <div>
              <CardTitle className="text-sm">Introduction Video</CardTitle>
              <p className="text-xs text-muted-foreground">
                Videos to help you get started with Fresco
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <FileText size={30} className="mr-2" />
            <div>
              <CardTitle className="text-sm">Documentation Articles</CardTitle>
              <p className="text-xs text-muted-foreground">
                Articles to help you get started with Fresco
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent></CardContent>
      </Card>

      <div className="flex justify-start pt-4">
        <Button onClick={handleFinishOnboarding}>Finish Onboarding</Button>
      </div>
    </div>
  );
}

export default Documentation;

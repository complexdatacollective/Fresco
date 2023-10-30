'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { FileText, Loader2, MonitorPlay } from 'lucide-react';
import { FancyButton } from '~/components/ui/FancyButton';
import { useRouter } from 'next/navigation';
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
import { setAppConfigured } from '~/app/_actions';

function Documentation() {
  const { pending: loading } = useFormStatus();

  if (loading) {
    return (
      <div className="flex w-[30rem] items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Finalizing setup...</h2>
          <Loader2 size={50} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="mb-4 mt-4">
          This is the end of the onboarding process. You are now ready to use
          Fresco! For further help and information, consider using the resources
          below.
        </p>
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

      <div className="flex justify-start pt-12">
        <form action={setAppConfigured}>
          <FancyButton type="submit">Go to the dashboard!</FancyButton>
        </form>
      </div>
    </div>
  );
}

export default Documentation;

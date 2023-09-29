import { trpcRscHTTP } from '~/app/_trpc/server';
// import { Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const resetMetaAction = async () => {
    'use server';

    await trpcRscHTTP.metadata.reset.mutate();

    await trpcRscHTTP.session.get.revalidate();
    await trpcRscHTTP.metadata.get.revalidate();
  };

  return (
    <form action={resetMetaAction}>
      <Button variant="destructive" type="submit">
        {/* {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
        Reset
      </Button>
    </form>
  );
};

export default ResetButton;

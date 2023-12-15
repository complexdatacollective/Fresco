import Link from 'next/link';
import { Button } from '~/components/ui/Button';

export default function Page({
  params,
}: {
  params: { participantId: string };
}) {
  return (
    <div>
      <h1>Page for {params.participantId}</h1>
      <Link href={`/interview/new?identifier=${params.participantId}`}>
        <Button>Start Interview</Button>
      </Link>
    </div>
  );
}

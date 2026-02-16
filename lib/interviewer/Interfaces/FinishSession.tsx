import { usePathname, useRouter } from 'next/navigation';
import { finishInterview } from '~/actions/interviews';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { default as Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';

const FinishSession = () => {
  const pathname = usePathname();
  const router = useRouter();

  const interviewId = pathname.split('/').pop(); // TODO: this should come from redux

  const { confirm } = useDialog();

  const finishInterviewConfirmation = () =>
    confirm({
      title: 'Are you sure you want to finish the interview?',
      description:
        'Your responses cannot be changed after you finish the interview.',
      confirmLabel: 'Finish Interview',
      onConfirm: async () => {
        if (!interviewId) {
          throw new Error('No interview id found');
        }
        const finished = await finishInterview(interviewId);

        if (finished && !finished.error) {
          router.push(`/interview/finished`);
        }
      },
    });

  return (
    <div className="interface">
      <Surface className="w-full max-w-2xl" noContainer>
        <Heading level="h1">Finish Interview</Heading>
        <Paragraph>
          You have reached the end of the interview. If you are satisfied with
          the information you have entered, you may finish the interview now.
        </Paragraph>
        <Button color="primary" onClick={finishInterviewConfirmation}>
          Finish
        </Button>
      </Surface>
    </div>
  );
};

export default FinishSession;

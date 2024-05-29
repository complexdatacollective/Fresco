import { getInterviews } from '~/queries/interviews';
import { getProtocols } from '~/queries/protocols';
import InterviewsTableClient from './InterviewsTableClient';

export default function InterviewsTable() {
  const interviewsPromise = getInterviews();
  const protocolsPromise = getProtocols();

  return (
    <InterviewsTableClient
      interviewsPromise={interviewsPromise}
      protocolsPromise={protocolsPromise}
    />
  );
}

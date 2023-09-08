import { safeLoadInterview } from './Loader';

export default async function Page() {
  const interviewData = await safeLoadInterview('clllc7mgv000rsv5g8c15ap6d');
  if (!interviewData) {
    return <div>No data found</div>;
  }
  return <div>interview{JSON.stringify(interviewData)}</div>;
}

import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/utils/auth";
import { prisma } from "~/utils/db";

async function getInterviewData(id: string) {
  console.log("Looking for interview with id", id);
  const interview = await prisma.interview.findUnique({
    where: {
      id: id,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
      protocol: true,
    },
  });

  return interview;
}

export default async function Page({
  params,
}: {
  params: { interview: string[] };
}) {
  // Get session so we can check if the user is allowed to view this interview
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  // /interview/:interviewID/:page
  const { interview } = params;

  const interviewId = interview?.[0];

  // Fetch interview data from the database
  const interviewData = await getInterviewData(interviewId);

  if (!interviewData) {
    redirect("/");
  }

  // TODO: Check here that the logged in user has access to this interview
  // If not, redirect to the main dashboard

  const interviewPage = interview?.[1]; // item || null

  if (!interviewPage) {
    redirect(`/interview/${interviewId}/1`);
  }

  return (
    <div className="prose">
      <h1>Interview Session</h1>
      <h2>Stage {interviewPage}</h2>
      {/* Will sync network changes in background to the database */}
      {/* <ContextProvider protocol={interviewData} session={session}>
        <Stage />
      </ContextProvider> */}
    </div>
  );
}

const Stage = () => {
  const { protocol, stageConfiguration, updateNetwork, currentNetwork } =
    useSessionContext();

  return <div>{stage}</div>;
};

import { redirect } from "next/navigation";
import { NetworkProvider } from "~/contexts/NetworkProvider";
import Stage from "~/components/Stage";
import { getServerAuthSession } from "~/utils/auth";
import { prisma } from "~/utils/db";
import InterviewNavigation from "~/components/interview/InterviewNavigation";
import { NcNetwork, Stage as StageType } from "~/lib/shared-consts";

async function getInterviewData(id: string) {
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
  const interviewId = params.interview?.[0];
  const currentInterviewPage = params.interview?.[1]; // item || null

  // If theres no interview ID in the URL, redirect to the main dashboard
  if (!interviewId) {
    redirect("/");
  }

  // Get session so we can check if the user is allowed to view this interview
  const session = await getServerAuthSession();

  // If the user is not logged in, redirect to the signin page
  if (!session) {
    redirect("/signin");
  }

  // Fetch interview data from the database
  const interviewData = await getInterviewData(interviewId);

  // If theres no interview data in the database, redirect to the main dashboard
  if (!interviewData) {
    redirect("/");
  }

  // TODO: Check here that the logged in user has access to this interview
  // If not, redirect to the main dashboard

  // If theres no interview page in the URL:
  // (1) Check if there is a current stage in the DB
  // (2) Redirect to the first page
  if (!currentInterviewPage && interviewId) {
    if (interviewData.currentStep) {
      redirect(`/interview/${interviewId}/${interviewData.currentStep}`);
    }

    redirect(`/interview/${interviewId}/1`);
  }

  // Fetch the protocol stage configuration for the current page from the database
  const {
    network,
    protocol: { stages },
  } = interviewData;

  const stagesJson = JSON.parse(stages) as StageType[];

  const currentStageConfig = stagesJson[currentInterviewPage - 1];

  const updateNetwork = async (network: NcNetwork) => {
    "use server";

    console.log("updateNetwork", network);

    // Simulate 2 second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        network: JSON.stringify(network),
      },
    });
    console.log("update complete!");
  };

  return (
    <div className="container">
      <h1>Interview Session</h1>
      <NetworkProvider network={network} updateNetwork={updateNetwork}>
        <Stage stageConfig={currentStageConfig} />
      </NetworkProvider>
      {/* Will sync network changes in background to the database */}
      {/* <ContextProvider protocol={interviewData} session={session}>
        <Stage />
      </ContextProvider> */}
      <aside className="sticky bottom-10 flex w-full items-center justify-center">
        <InterviewNavigation />
      </aside>
    </div>
  );
}

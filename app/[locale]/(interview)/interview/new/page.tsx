/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/utils/auth";

const createInterview = async (user) => {
  if (!user) {
    throw new Error("No user provided");
  }

  const interview = await prisma.interview.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return interview;
};

// interview/new

export default async function Page() {
  // Check we have a currently logged in user
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  // Create a new interview
  const interview = await createInterview(session.user);

  // Redirect to the interview/[id] route
  redirect(`/interview/${interview.id}`);
}

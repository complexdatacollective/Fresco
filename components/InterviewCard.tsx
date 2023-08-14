"use client";

import Link from "next/link";
import type { Prisma } from "@prisma/client";

type Props = {
  interview: Prisma.InterviewGetPayload<{
    include: { protocol: true; user: { select: { name: true } } };
  }>;
};

const InterviewCard = ({ interview }: Props) => {
  const {
    id,
    protocol: { name: protocolName },
    lastUpdated,
    user: { name: userName },
  } = interview;

  return (
    <Link
      href={`/interview/${id}`}
      className="m-2 block w-full rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        ID: {id}
      </h5>
      <h5 className="text-md mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
        Protocol: {protocolName}
      </h5>
      <h5 className="text-md mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
        User: {userName}
      </h5>
      <h5 className="text-md mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
        Last Updated: {lastUpdated.toDateString()}
      </h5>
    </Link>
  );
};

export default InterviewCard;

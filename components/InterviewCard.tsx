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
      className="m-2 block w-[500px] rounded-lg border border-l-8 border-violet-700 bg-white p-6 shadow"
    >
      <h5 className="mb-6 text-2xl tracking-tight text-gray-900">ID: {id}</h5>
      <h5 className="text-md tracking-tight text-gray-900">
        Protocol: {protocolName}
      </h5>
      <h5 className="text-md tracking-tight text-gray-900">User: {userName}</h5>
      <h5 className="text-md tracking-tight text-gray-900">
        Last Updated: {lastUpdated.toDateString()}
      </h5>
    </Link>
  );
};

export default InterviewCard;

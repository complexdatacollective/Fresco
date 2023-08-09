"use client";

import Link from "next/link";
import { Typography } from "./Typography";

const InterviewCard = ({ interview }) => {
  const {
    id,
    protocol: { name: protocolName },
    lastUpdated,
    user: { name: userName },
  } = interview;

  return (
    <Link
      href={`/interview/${id}`}
      className="m-2 block w-full rounded-lg border border-gray-200 bg-white p-6 shadow contrast-more:border-2 contrast-more:border-gray-800 contrast-more:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:contrast-more:border-gray-100 dark:contrast-more:bg-gray-800"
    >
      <Typography variant="h3" className="mb-2 tracking-tight">
        ID: {id}
      </Typography>
      <Typography variant="h4" className="mb-2 tracking-tight">
        Protocol: {protocolName}
      </Typography>
      <Typography variant="h4" className="mb-2 tracking-tight">
        User: {userName}
      </Typography>
      <Typography variant="h4" className="mb-2 tracking-tight">
        Last Updated: {lastUpdated.toLocaleDateString()}
      </Typography>
      {/* <p className="font-normal text-gray-700 dark:text-gray-400">
        Here are the biggest enterprise technology acquisitions of 2021 so far,
        in reverse chronological order.
      </p> */}
    </Link>
  );
};

export default InterviewCard;

"use client";

import Link from "next/link";

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
        Last Updated: {lastUpdated.toLocaleDateString()}
      </h5>
      {/* <p className="font-normal text-gray-700 dark:text-gray-400">
        Here are the biggest enterprise technology acquisitions of 2021 so far,
        in reverse chronological order.
      </p> */}
    </Link>
  );
};

export default InterviewCard;

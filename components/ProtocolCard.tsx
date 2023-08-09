"use client";

import Link from "next/link";
import { Typography } from "./Typography";

const ProtocolCard = ({ protocol }) => {
  const { id, name, description } = protocol;

  return (
    <Link
      href={`/interview/new?protocol=${id}`}
      className="block max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow contrast-more:border-2 contrast-more:border-gray-800 contrast-more:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:contrast-more:border-gray-100 dark:contrast-more:bg-gray-800"
    >
      <Typography variant="h3" className="mb-2 tracking-tight">
        {name}
      </Typography>
      <Typography variant="h4" className="mb-2 tracking-tight">
        {description}
      </Typography>
    </Link>
  );
};

export default ProtocolCard;

"use client";

import Link from "next/link";
import { Typography } from "./Typography";

const ProtocolCard = ({ protocol }) => {
  const { id, name, description } = protocol;

  return (
    <Link
      href={`/interview/new?protocol=${id}`}
      className="block max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
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

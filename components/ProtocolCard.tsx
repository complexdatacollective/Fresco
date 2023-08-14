"use client";

import type { Prisma } from "@prisma/client";
import Link from "next/link";

type Props = {
  protocol: Prisma.ProtocolGetPayload<object>;
};

const ProtocolCard = ({ protocol }: Props) => {
  const { id, name, description } = protocol;

  return (
    <Link
      href={`/interview/new?protocol=${id}`}
      className="block max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {name}
      </h5>
      <h5 className="text-md mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
        {description}
      </h5>
    </Link>
  );
};

export default ProtocolCard;

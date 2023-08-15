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
      className="block w-[500px] rounded-lg border border-l-8 border-gray-200 border-violet-700 bg-white p-6 shadow"
    >
      <h5 className="mb-2 text-2xl tracking-tight text-gray-900">{name}</h5>
      <h5 className="text-md mb-2 tracking-tight text-gray-900">
        {description}
      </h5>
    </Link>
  );
};

export default ProtocolCard;

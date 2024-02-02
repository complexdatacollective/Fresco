'use client';

import type { Prisma } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  protocol: Prisma.ProtocolGetPayload<object>;
};

const ProtocolCard = ({ protocol }: Props) => {
  const { id, name, description } = protocol;

  return (
    <Link href={`/interview/new?protocol=${id}`} className="inline">
      <div className="mb-4 inline-flex w-[500px] flex-col overflow-hidden rounded-xl border bg-white shadow-md transition duration-200 ease-in-out hover:shadow-lg">
        <div className="p-6">
          <h5 className="mb-2 text-2xl tracking-tight text-gray-900">{name}</h5>
          <h5 className="text-md mb-2 tracking-tight text-gray-900">
            {description}
          </h5>
        </div>
        <div className="flex items-center justify-between bg-indigo-500 p-6 text-xs text-white">
          <div>
            <ul>
              <li>Installed: 12/45/2344, 3:31pm</li>
              <li>Last Modified: 12/45/2344, 3:31pm</li>
              <li>Schema Version: 7</li>
            </ul>
          </div>
          <div>
            <Image
              src="images/file-icon.svg"
              alt="protocol card"
              width={50}
              height={50}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProtocolCard;

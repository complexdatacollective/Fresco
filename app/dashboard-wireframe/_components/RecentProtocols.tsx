'use client';

import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';

const protocols = [
  {
    id: 1,
    name: 'Sample Protocol',
    description:
      'This is a demonstration protocol designed to illustrate the features of the Network Canvas Interviewer app',
    active: false,
    importedAt: '2023-12-05T13:28:06.974Z',
    lastModified: '2021-06-21T22:16:19.056Z',
    assetNumber: 10,
  },
  {
    id: 2,
    name: 'Sample Protocol 2',
    description:
      'This is a demonstration protocol designed to illustrate the features of the Network Canvas Interviewer app',
    active: true,
    importedAt: '2023-12-05T13:28:06.974Z',
    lastModified: '2021-06-21T22:16:19.056Z',
    assetNumber: 10,
  },
  {
    id: 3,
    name: 'Sample Protocol 3',
    description:
      'This is a demonstration protocol designed to illustrate the features of the Network Canvas Interviewer app',
    active: false,
    importedAt: '2023-12-05T13:28:06.974Z',
    lastModified: '2021-06-21T22:16:19.056Z',
    assetNumber: 10,
  },
];

const RecentProtocols = () => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="w-full lg:mx-0 lg:max-w-none">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Recent protocols
          </h2>
          <Link
            href="#"
            className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            View all<span className="sr-only">, protocols</span>
          </Link>
        </div>
        <ul
          role="list"
          className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8"
        >
          {protocols.map((protocol) => (
            <li
              key={protocol.id}
              className="overflow-hidden rounded-xl border border-gray-200"
            >
              <div className="relative flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
                {protocol.active ? (
                  <BadgeCheck
                    size={35}
                    className="absolute right-3 top-2 cursor-pointer fill-purple-500 text-white"
                  />
                ) : (
                  <button
                    className="absolute right-3 top-2"
                    title="Make active..."
                  >
                    <BadgeCheck className="cursor-pointer fill-white text-primary/20 hover:scale-150 hover:fill-purple-500 hover:text-white" />
                  </button>
                )}
                <div className="space-y-3">
                  <h3 className="text-xl font-medium leading-6 text-gray-900">
                    {protocol.name}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">
                    {protocol.description}
                  </p>
                </div>
              </div>
              <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Imported at</dt>
                  <dd className="text-gray-700">
                    <time dateTime={protocol.importedAt}>
                      {new Date(protocol.importedAt).toDateString()}
                    </time>
                  </dd>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">Last modified</dt>
                  <dd className="text-gray-700">
                    <time dateTime={protocol.lastModified}>
                      {new Date(protocol.lastModified).toDateString()}
                    </time>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentProtocols;

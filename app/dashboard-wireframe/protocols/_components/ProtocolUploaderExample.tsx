import { FileBarChart } from 'lucide-react';

export default function ProtocolUploaderExample() {
  return (
    <button
      type="button"
      className="relative mx-auto block w-1/3 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <FileBarChart className="mx-auto h-12 w-12 text-gray-400" />
      <span className="mt-2 block text-sm font-semibold text-gray-900">
        Click to select <span className="italic">.netcanvas</span> files or drag
        and drop here.
      </span>
    </button>
  );
}

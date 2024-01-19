import { ArrowDownToLine } from 'lucide-react';

const ExportingStateAnimation = () => {
  return (
    <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-3 bg-black text-white opacity-90">
      <div className="animate-bounce rounded-full border-2 border-white bg-green-600 p-4 text-white">
        <ArrowDownToLine className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-lg font-semibold">Saving file please wait...</h2>
    </div>
  );
};

export default ExportingStateAnimation;

import { Loader2 } from 'lucide-react';

const ExportingStateAnimation = () => {
  return (
    <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-3 bg-black text-white opacity-90">
      <Loader2 className="h-20 w-20 animate-spin" />
      <h2 className="text-lg font-semibold">
        Exporting and zipping files. Please wait...
      </h2>
    </div>
  );
};

export default ExportingStateAnimation;

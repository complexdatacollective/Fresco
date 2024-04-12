import { Loader2 } from 'lucide-react';

export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin" />
    </div>
  );
}

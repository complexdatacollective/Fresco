import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <main className="flex h-screen items-center justify-center">
      <Loader2 size={64} className="animate-spin" />
    </main>
  );
}

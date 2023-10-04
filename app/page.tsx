/**
 * This page is sometimes rendered while we wait for the redirect URL to be
 * calculated. What should we show here? The NC loading spinner won't work
 * because it is a class component. Using lucide for now.
 */

import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <div className="flex h-screen w-screen flex-row items-center justify-center bg-violet-950 text-white">
      <Loader2 className="h-52 w-52 animate-spin" />
    </div>
  );
}

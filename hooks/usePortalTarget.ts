import { useEffect, useState } from 'react';

export default function usePortalTarget(id: string) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById(id));
  }, [id]);
  return target;
}

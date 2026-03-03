import { useEffect, useState } from 'react';

export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform: string } };
    const value = nav.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.userAgent);
    queueMicrotask(() => setIsMac(value));
  }, []);

  return isMac;
}

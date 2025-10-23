'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';

export default function PHProvider({ children }: { children: ReactNode }) {
  const [ph, setPh] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (typeof window === 'undefined') return;

      // Importa posthog-js SOLO en el cliente
      const { default: posthog } = await import('posthog-js');

      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      if (key && !('__PH_INITIALIZED__' in window)) {
        // evita doble init en HMR
        (window as any).__PH_INITIALIZED__ = true;
        posthog.init(key, {
          api_host: host,
          capture_pageview: false, // lo haremos manual si quieres
        });
      }

      if (mounted) setPh(posthog);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Mientras carga, renderiza la app normalmente
  if (!ph) return <>{children}</>;

  return <PostHogProvider client={ph}>{children}</PostHogProvider>;
}

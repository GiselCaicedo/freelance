import type messages from '@app/locales/en.json';
import type { routing } from '@core/libs/I18nRouting';

declare module 'next-intl' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

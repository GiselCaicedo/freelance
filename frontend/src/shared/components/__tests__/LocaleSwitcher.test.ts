import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LocaleSwitcher } from '../LocaleSwitcher';

vi.mock('next-intl', () => ({
  useLocale: () => 'es',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/libs/I18nNavigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('@/libs/I18nRouting', () => ({
  routing: {
    locales: ['es', 'en', 'pt'],
  },
}));

describe('LocaleSwitcher', () => {
  it('matches the snapshot for shared locales', () => {
    const markup = renderToStaticMarkup(createElement(LocaleSwitcher));

    expect(markup).toMatchInlineSnapshot(
      `"<select class=\"border border-gray-300 font-medium focus:outline-hidden focus-visible:ring-3\" aria-label=\"lang-switcher\"><option value=\"es\" selected=\"\">ES</option><option value=\"en\">EN</option><option value=\"pt\">PT</option></select>"`,
    );
  });
});

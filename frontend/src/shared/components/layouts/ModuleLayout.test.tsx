import { page } from '@vitest/browser/context';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import ModuleLayout from './ModuleLayout';

// Mocks
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    useParams: () => ({ locale: 'es' }),
    usePathname: () => '/es/dashboard',
    useRouter: () => ({ replace: vi.fn() }),
  };
});

// Simple permission mock based on a shared set
const perms = new Set<string>();
vi.mock('@core/libs/acl/PermissionProvider', () => ({
  usePermission: () => ({ can: (p: string) => perms.has(p) }),
  default: () => null,
}));

vi.mock('@core/libs/acl/EnterpriseProvider', () => ({
  useEnterprise: () => ({ empresaName: 'ACME' }),
  default: () => null,
}));

describe('ModuleLayout', () => {
  beforeEach(() => {
    perms.clear();
  });

  it('renders admin when user has admin permission', () => {
    perms.add('admin');
    render(
      <ModuleLayout variant="admin">
        <div>content</div>
      </ModuleLayout>,
    );

    expect(page.getByText('content').isVisible()).toBe(true);
  });

  it('renders client when user has client permission', () => {
    perms.add('client');
    render(
      <ModuleLayout variant="client">
        <div>client-content</div>
      </ModuleLayout>,
    );

    expect(page.getByText('client-content').isVisible()).toBe(true);
  });

  it('shows redirecting state when missing permissions', () => {
    render(
      <ModuleLayout variant="admin">
        <div>should-not-see</div>
      </ModuleLayout>,
    );

    // useTranslations mock returns the key passed
    expect(page.getByText('nav.redirecting').isVisible()).toBe(true);
  });
});

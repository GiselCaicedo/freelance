import { verifyToken } from '@core/libs/Auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const normalizePermission = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export default async function LocalePanelRedirect({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale ?? 'es';
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value ?? '';

  if (!token) {
    redirect(`/${locale}/sign-in`);
  }

  const payload = await verifyToken<{ permissions?: string[]; roleCategory?: string }>(token);
  const permissions = (payload?.permissions ?? []).map(normalizePermission);

  const panelRaw
    = (payload as any)?.roleCategory
      ?? (payload as any)?.role_category
      ?? (payload as any)?.panel
      ?? '';

  const panel = typeof panelRaw === 'string' ? panelRaw.trim().toLowerCase() : '';

  if (permissions.includes('admin') || panel === 'admin') {
    redirect(`/${locale}/admin/dashboard`);
  }

  if (permissions.includes('client') || permissions.includes('cliente') || panel === 'client') {
    redirect(`/${locale}/client/dashboard`);
  }

  redirect(`/${locale}/sign-in`);
}

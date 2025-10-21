import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/libs/Auth';
import ClientLayout from './client/layout';
import ClientDashboard from '@/panels/client/pages/Dashboard';

const normalizePermission = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export default async function LocalePanelRedirect({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale ?? 'es';
  const token = cookies().get('auth_token')?.value ?? '';

  if (!token) {
    redirect(`/${locale}/sign-in`);
  }

  const payload = await verifyToken<{ permissions?: string[] }>(token);
  const permissions = payload?.permissions ?? [];
  const normalized = permissions
    .map(normalizePermission)
    .filter((permission) => permission.length > 0);

  if (normalized.includes('admin')) {
    redirect(`/${locale}/admin/dashboard`);
  }

  if (normalized.includes('client')) {
   redirect(`/${locale}/client/dashboard`);
  }

  redirect(`/${locale}/sign-in`);
}

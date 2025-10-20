import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/libs/Auth';

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
    redirect(`/${locale}/dashboard`);
  }

  if (normalized.includes('cliente') || normalized.includes('client')) {
    redirect(`/${locale}/client`);
  }

  redirect(`/${locale}/sign-in`);
}

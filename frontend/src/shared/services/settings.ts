import { api } from './conexion';

export interface GeneralSetting {
  id: string;
  client_id: string | null;
  company_timezone: string | null;
  company_locale: string | null;
  currency: string | null;
  first_day_of_week: number | null;
  number_decimals: number | null;
  date_format: string | null;
  time_format: string | null;
  branding_primary_color: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  status: boolean | null;
  created?: string | null;
  updated?: string | null;
}

export type GeneralSettingPayload = Partial<Omit<GeneralSetting, 'id'>> & { id?: string; client_id?: string | null };

export async function getGeneralSettingApi(clientId?: string | null): Promise<GeneralSetting | null> {
  const params = clientId ? { clientId } : undefined;
  const { data } = await api.get('/config/settings/general', { params });
  if (data?.success) return (data.data ?? null) as GeneralSetting | null;
  return (data ?? null) as GeneralSetting | null;
}

export async function saveGeneralSettingApi(payload: GeneralSettingPayload): Promise<GeneralSetting> {
  const { data } = await api.post('/config/settings/general', payload);
  if (data?.success && data?.data) return data.data as GeneralSetting;
  throw new Error(data?.message ?? 'No fue posible guardar la configuración general');
}

export interface SmtpConfig {
  id: string;
  client_id: string | null;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  password_encrypted: string | null;
  from_name: string | null;
  from_email: string | null;
  reply_to_email: string | null;
  rate_limit_per_minute: number | null;
  last_test_status: string | null;
  last_test_at: string | null;
  is_active: boolean | null;
  status: boolean | null;
}

export type SmtpConfigPayload = Partial<Omit<SmtpConfig, 'id'>> & { id?: string; client_id?: string | null };

export async function getSmtpConfigApi(clientId?: string | null): Promise<SmtpConfig | null> {
  const params = clientId ? { clientId } : undefined;
  const { data } = await api.get('/config/settings/smtp', { params });
  if (data?.success) return (data.data ?? null) as SmtpConfig | null;
  return (data ?? null) as SmtpConfig | null;
}

export async function saveSmtpConfigApi(payload: SmtpConfigPayload): Promise<SmtpConfig> {
  const { data } = await api.post('/config/settings/smtp', payload);
  if (data?.success && data?.data) return data.data as SmtpConfig;
  throw new Error(data?.message ?? 'No fue posible guardar la configuración SMTP');
}

export interface AlertRule {
  id: string;
  client_id: string;
  name: string;
  type: string;
  conditions: Record<string, any> | null;
  channels: string[];
  remind_before_minutes: number[];
  is_active: boolean | null;
  created?: string | null;
  updated?: string | null;
}

export type AlertRulePayload = Partial<Omit<AlertRule, 'conditions'>> & {
  id?: string;
  client_id: string;
  conditions?: Record<string, any> | string | null;
  channels?: string[] | null;
  remind_before_minutes?: (number | string)[] | null;
};

export async function listAlertRulesApi(clientId: string): Promise<AlertRule[]> {
  const { data } = await api.get('/config/settings/alerts', { params: { clientId } });
  if (data?.success && Array.isArray(data.data)) return data.data as AlertRule[];
  if (Array.isArray(data)) return data as AlertRule[];
  return [];
}

export async function saveAlertRuleApi(payload: AlertRulePayload): Promise<AlertRule> {
  const { data } = await api.post('/config/settings/alerts', payload);
  if (data?.success && data?.data) return data.data as AlertRule;
  throw new Error(data?.message ?? 'No fue posible guardar la alerta');
}

export async function deleteAlertRuleApi(id: string): Promise<void> {
  const { data } = await api.delete(`/config/settings/alerts/${id}`);
  if (data?.success === false) {
    throw new Error(data?.message ?? 'No fue posible eliminar la alerta');
  }
}

export interface UserSetting {
  id: string;
  user_id: string;
  locale: string | null;
  timezone: string | null;
  theme: string | null;
  date_format: string | null;
  time_format: string | null;
  dashboard_config: Record<string, any> | null;
  notify_email: boolean | null;
  notify_push: boolean | null;
  notify_whatsapp: boolean | null;
  reminder_default_minutes: number | null;
  digest_daily_hour: number | null;
  twofa_enabled: boolean | null;
  twofa_method: string | null;
  session_timeout_minutes: number | null;
  status: boolean | null;
}

export type UserSettingPayload = Partial<Omit<UserSetting, 'id' | 'user_id'>>;

export async function getUserSettingsApi(userId: string): Promise<UserSetting | null> {
  const { data } = await api.get(`/config/settings/user/${userId}/preferences`);
  if (data?.success) return (data.data ?? null) as UserSetting | null;
  return (data ?? null) as UserSetting | null;
}

export async function saveUserSettingsApi(userId: string, payload: UserSettingPayload): Promise<UserSetting> {
  const { data } = await api.post(`/config/settings/user/${userId}/preferences`, payload);
  if (data?.success && data?.data) return data.data as UserSetting;
  throw new Error(data?.message ?? 'No fue posible guardar las preferencias del usuario');
}

export interface UserNotificationSetting {
  id: string;
  user_id: string;
  channel_email: boolean | null;
  channel_push: boolean | null;
  channel_whatsapp: boolean | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  digest_daily_hour: number | null;
}

export type UserNotificationSettingPayload = Partial<Omit<UserNotificationSetting, 'id' | 'user_id'>>;

export async function getUserNotificationSettingsApi(userId: string): Promise<UserNotificationSetting | null> {
  const { data } = await api.get(`/config/settings/user/${userId}/notifications`);
  if (data?.success) return (data.data ?? null) as UserNotificationSetting | null;
  return (data ?? null) as UserNotificationSetting | null;
}

export async function saveUserNotificationSettingsApi(
  userId: string,
  payload: UserNotificationSettingPayload,
): Promise<UserNotificationSetting> {
  const { data } = await api.post(`/config/settings/user/${userId}/notifications`, payload);
  if (data?.success && data?.data) return data.data as UserNotificationSetting;
  throw new Error(data?.message ?? 'No fue posible guardar las notificaciones del usuario');
}

export interface UserTwofaSetting {
  id: string;
  user_id: string;
  type: string;
  secret_encrypted: string | null;
  backup_codes: Record<string, any> | null;
  enabled: boolean | null;
}

export type UserTwofaPayload = Partial<Omit<UserTwofaSetting, 'id' | 'user_id'>>;

export async function getUserTwofaApi(userId: string): Promise<UserTwofaSetting | null> {
  const { data } = await api.get(`/config/settings/user/${userId}/twofa`);
  if (data?.success) return (data.data ?? null) as UserTwofaSetting | null;
  return (data ?? null) as UserTwofaSetting | null;
}

export async function saveUserTwofaApi(userId: string, payload: UserTwofaPayload): Promise<UserTwofaSetting> {
  const { data } = await api.post(`/config/settings/user/${userId}/twofa`, payload);
  if (data?.success && data?.data) return data.data as UserTwofaSetting;
  throw new Error(data?.message ?? 'No fue posible guardar la configuración de 2FA');
}

export interface SecurityPolicy {
  id: string;
  client_id: string | null;
  require_2fa_all: boolean | null;
  require_2fa_admin: boolean | null;
  allowed_2fa_methods: string[];
  allowed_ips: string[];
  max_concurrent_sessions: number | null;
  is_active: boolean | null;
  status: boolean | null;
}

export type SecurityPolicyPayload = Partial<Omit<SecurityPolicy, 'id'>> & { id?: string; client_id?: string | null };

export async function getSecurityPolicyApi(clientId?: string | null): Promise<SecurityPolicy | null> {
  const params = clientId ? { clientId } : undefined;
  const { data } = await api.get('/config/settings/security/policy', { params });
  if (data?.success) return (data.data ?? null) as SecurityPolicy | null;
  return (data ?? null) as SecurityPolicy | null;
}

export async function saveSecurityPolicyApi(payload: SecurityPolicyPayload): Promise<SecurityPolicy> {
  const { data } = await api.post('/config/settings/security/policy', payload);
  if (data?.success && data?.data) return data.data as SecurityPolicy;
  throw new Error(data?.message ?? 'No fue posible guardar la política de seguridad');
}

export interface SessionPolicy {
  id: string;
  client_id: string | null;
  idle_timeout_minutes: number | null;
  absolute_session_minutes: number | null;
  remember_me_days: number | null;
  lock_after_failed_attempts: number | null;
  lock_window_minutes: number | null;
  lock_duration_minutes: number | null;
  is_active: boolean | null;
  status: boolean | null;
}

export type SessionPolicyPayload = Partial<Omit<SessionPolicy, 'id'>> & { id?: string; client_id?: string | null };

export async function getSessionPolicyApi(clientId?: string | null): Promise<SessionPolicy | null> {
  const params = clientId ? { clientId } : undefined;
  const { data } = await api.get('/config/settings/security/session', { params });
  if (data?.success) return (data.data ?? null) as SessionPolicy | null;
  return (data ?? null) as SessionPolicy | null;
}

export async function saveSessionPolicyApi(payload: SessionPolicyPayload): Promise<SessionPolicy> {
  const { data } = await api.post('/config/settings/security/session', payload);
  if (data?.success && data?.data) return data.data as SessionPolicy;
  throw new Error(data?.message ?? 'No fue posible guardar la política de sesión');
}

export interface PasswordPolicy {
  id: string;
  client_id: string | null;
  min_length: number | null;
  require_uppercase: boolean | null;
  require_lowercase: boolean | null;
  require_number: boolean | null;
  require_special: boolean | null;
  disallow_common_passwords: boolean | null;
  expire_days: number | null;
  history_last_n: number | null;
  is_active: boolean | null;
  status: boolean | null;
}

export type PasswordPolicyPayload = Partial<Omit<PasswordPolicy, 'id'>> & { id?: string; client_id?: string | null };

export async function getPasswordPolicyApi(clientId?: string | null): Promise<PasswordPolicy | null> {
  const params = clientId ? { clientId } : undefined;
  const { data } = await api.get('/config/settings/security/password', { params });
  if (data?.success) return (data.data ?? null) as PasswordPolicy | null;
  return (data ?? null) as PasswordPolicy | null;
}

export async function savePasswordPolicyApi(payload: PasswordPolicyPayload): Promise<PasswordPolicy> {
  const { data } = await api.post('/config/settings/security/password', payload);
  if (data?.success && data?.data) return data.data as PasswordPolicy;
  throw new Error(data?.message ?? 'No fue posible guardar la política de contraseñas');
}

export interface CompanyProfile {
  id: string;
  name: string | null;
  status: boolean | null;
  created?: string | null;
  updated?: string | null;
}

export type CompanyProfilePayload = Partial<Omit<CompanyProfile, 'id'>>;

export async function getCompanyProfileApi(clientId: string): Promise<CompanyProfile | null> {
  const { data } = await api.get(`/config/settings/company/${clientId}`);
  if (data?.success) return (data.data ?? null) as CompanyProfile | null;
  return (data ?? null) as CompanyProfile | null;
}

export async function saveCompanyProfileApi(clientId: string, payload: CompanyProfilePayload): Promise<CompanyProfile> {
  const { data } = await api.post(`/config/settings/company/${clientId}`, payload);
  if (data?.success && data?.data) return data.data as CompanyProfile;
  throw new Error(data?.message ?? 'No fue posible actualizar la empresa');
}

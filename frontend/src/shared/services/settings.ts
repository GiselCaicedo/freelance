import { api } from './conexion';

export interface GeneralSetting {
  id: string;
  company_timezone: string | null;
  company_locale: string | null;
  currency: string | null;
  first_day_of_week: number | null;
  number_decimals: number | null;
  date_format: string | null;
  time_format: string | null;
  branding_primary_color: string | null;
  logo_url: string | null;
  created?: string | null;
  updated?: string | null;
}

export type GeneralSettingPayload = Partial<Omit<GeneralSetting, 'id'>> & { id?: string };

export async function getGeneralSettingApi(): Promise<GeneralSetting | null> {
  const { data } = await api.get('/config/settings/general');
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
}

export type SmtpConfigPayload = Partial<Omit<SmtpConfig, 'id'>> & { id?: string };

export async function getSmtpConfigApi(): Promise<SmtpConfig | null> {
  const { data } = await api.get('/config/settings/smtp');
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
  conditions?: Record<string, any> | string | null;
  channels?: string[] | null;
  remind_before_minutes?: (number | string)[] | null;
};

export async function listAlertRulesApi(): Promise<AlertRule[]> {
  const { data } = await api.get('/config/settings/alerts');
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

export interface SecurityPolicy {
  id: string;
  require_2fa_all: boolean | null;
  require_2fa_admin: boolean | null;
  allowed_2fa_methods: string[];
  allowed_ips: string[];
  max_concurrent_sessions: number | null;
}

export type SecurityPolicyPayload = Partial<Omit<SecurityPolicy, 'id'>> & { id?: string };

export async function getSecurityPolicyApi(): Promise<SecurityPolicy | null> {
  const { data } = await api.get('/config/settings/security/policy');
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
  idle_timeout_minutes: number | null;
  absolute_session_minutes: number | null;
  remember_me_days: number | null;
  lock_after_failed_attempts: number | null;
  lock_window_minutes: number | null;
  lock_duration_minutes: number | null;
}

export type SessionPolicyPayload = Partial<Omit<SessionPolicy, 'id'>> & { id?: string };

export async function getSessionPolicyApi(): Promise<SessionPolicy | null> {
  const { data } = await api.get('/config/settings/security/session');
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
  min_length: number | null;
  require_uppercase: boolean | null;
  require_lowercase: boolean | null;
  require_number: boolean | null;
  require_special: boolean | null;
  disallow_common_passwords: boolean | null;
  expire_days: number | null;
  history_last_n: number | null;
}

export type PasswordPolicyPayload = Partial<Omit<PasswordPolicy, 'id'>> & { id?: string };

export async function getPasswordPolicyApi(): Promise<PasswordPolicy | null> {
  const { data } = await api.get('/config/settings/security/password');
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

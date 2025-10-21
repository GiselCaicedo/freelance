import { buildPanelPermissionWhere, detectCategoryFromPermissionName, normalizeRoleCategory } from '../../modules/shared/services/panel.utils'

describe('panel.utils', () => {
  test('normalizeRoleCategory admite admin/client y alias', () => {
    expect(normalizeRoleCategory('admin')).toBe('admin')
    expect(normalizeRoleCategory('ADMIN')).toBe('admin')
    expect(normalizeRoleCategory('panel_admin')).toBe('admin')
    expect(normalizeRoleCategory('client')).toBe('client')
    expect(normalizeRoleCategory('Cliente')).toBe('client')
    expect(normalizeRoleCategory('panel_client')).toBe('client')
  })

  test('normalizeRoleCategory lanza en valores inválidos', () => {
    expect(() => normalizeRoleCategory('otro')).toThrow()
    expect(() => normalizeRoleCategory('')).toThrow()
  })

  test('detectCategoryFromPermissionName resuelve alias conocidos', () => {
    expect(detectCategoryFromPermissionName('admin')).toBe('admin')
    expect(detectCategoryFromPermissionName('cliente')).toBe('client')
    expect(detectCategoryFromPermissionName('panel_client')).toBe('client')
    expect(detectCategoryFromPermissionName(undefined)).toBeNull()
    expect(detectCategoryFromPermissionName(null as any)).toBeNull()
  })

  test('buildPanelPermissionWhere genera OR por alias', () => {
    const where = buildPanelPermissionWhere('client') as any
    expect(where).toHaveProperty('OR')
    const values = where.OR.map((c: any) => c.name.equals)
    expect(values).toEqual(expect.arrayContaining(['client', 'cliente', 'panel_client']))
  })
})


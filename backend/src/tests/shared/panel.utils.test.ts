import { normalizeRoleCategory, safeNormalizeRoleCategory } from '../../modules/shared/services/panel.utils.js'

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
    expect(() => normalizeRoleCategory(null as any)).toThrow()
  })

  test('safeNormalizeRoleCategory regresa null en valores inválidos', () => {
    expect(safeNormalizeRoleCategory('admin')).toBe('admin')
    expect(safeNormalizeRoleCategory('panel_client')).toBe('client')
    expect(safeNormalizeRoleCategory('otro')).toBeNull()
    expect(safeNormalizeRoleCategory(undefined)).toBeNull()
  })
})

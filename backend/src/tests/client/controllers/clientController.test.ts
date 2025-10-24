import { listUsers } from '../../../modules/client/controllers/clientController.js'

// Mock de servicio compartido de usuarios
jest.mock('../../../modules/shared/services/user.service.js', () => ({
  fetchUsers: jest.fn(async (_empresaId: string) => [{ id: 'u1', name: 'User 1' }]),
}))

describe('clientController', () => {
  test('listUsers usa empresaid del token para filtrar', async () => {
    const req: any = { user: { empresaid: 'c1' } }
    const json = jest.fn()
    const status = jest.fn(() => ({ json })) as any
    const res: any = { json, status }

    await listUsers(req, res)

    // Debe devolver el mock sin error de empresa
    expect(json).toHaveBeenCalledWith([{ id: 'u1', name: 'User 1' }])
  })

  test('listUsers retorna 400 si falta empresaid', async () => {
    const req: any = { user: {} }
    const json = jest.fn()
    const res: any = { json, status: (code: number) => ({ json: (p: any) => json({ code, ...p }) }) }

    await listUsers(req, res)
    expect(json).toHaveBeenCalled()
    const payload = json.mock.calls[0][0]
    expect(payload.code).toBe(400)
  })
})


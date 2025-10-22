import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'

export type ServiceStatus = 'active' | 'inactive'

export type ServiceCategoryRecord = {
  id: string
  name: string
}

export type ServiceClientAssignment = {
  id: string
  clientId: string
  clientName: string
  started: string | null
  delivery: string | null
  expiry: string | null
  frequency: string | null
  unit: string | null
  urlApi: string | null
  tokenApi: string | null
}

export type ServiceRecord = {
  id: string
  name: string
  description: string | null
  unit: string | null
  status: ServiceStatus
  category: ServiceCategoryRecord | null
  createdAt: string | null
  updatedAt: string | null
  clientsCount: number
}

export type ServiceDetail = ServiceRecord & {
  clients: ServiceClientAssignment[]
}

type PersistServicePayload = {
  name: string
  description?: string | null
  unit?: string | null
  status: ServiceStatus
  categoryId?: string | null
}

export class ServiceHasAssignmentsError extends Error {
  constructor(message = 'El servicio tiene clientes asignados') {
    super(message)
    this.name = 'ServiceHasAssignmentsError'
  }
}

const toIso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null)

const normalizeText = (value: string | null | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

const mapStatus = (status: boolean | null | undefined): ServiceStatus => (status === false ? 'inactive' : 'active')

const mapStatusToBoolean = (status: ServiceStatus): boolean => status === 'active'

const mapCategory = (category: any | null): ServiceCategoryRecord | null => {
  if (!category) return null
  return {
    id: category.id,
    name: normalizeText(category.name ?? null, 'Sin categoría'),
  }
}

const mapServiceRecord = (service: any): ServiceRecord => ({
  id: service.id,
  name: normalizeText(service.name ?? null, 'Servicio sin nombre'),
  description: service.description ?? null,
  unit: service.unit ?? null,
  status: mapStatus(service.status ?? null),
  category: mapCategory(service.service_category ?? null),
  createdAt: toIso(service.created),
  updatedAt: toIso(service.updated),
  clientsCount: service._count?.client_service ?? service.clientsCount ?? 0,
})

const mapClientAssignment = (assignment: any): ServiceClientAssignment => ({
  id: assignment.id,
  clientId: assignment.client_id ?? '',
  clientName: normalizeText(assignment.client?.name ?? null, 'Cliente sin nombre'),
  started: toIso(assignment.started),
  delivery: toIso(assignment.delivery),
  expiry: toIso(assignment.expiry),
  frequency: assignment.frequency ?? null,
  unit: assignment.unit ?? assignment.service?.unit ?? null,
  urlApi: assignment.url_api ?? null,
  tokenApi: assignment.token_api ?? null,
})

export async function listServices(): Promise<ServiceRecord[]> {
  const services = await prisma.service.findMany({
    include: {
      service_category: true,
      _count: { select: { client_service: true } },
    },
    orderBy: [{ name: 'asc' }],
  })

  return services.map(mapServiceRecord)
}

export async function fetchServiceCategories(): Promise<ServiceCategoryRecord[]> {
  const categories = await prisma.service_category.findMany({
    orderBy: [{ name: 'asc' }],
  })

  return categories.map((category) => ({
    id: category.id,
    name: normalizeText(category.name ?? null, 'Categoría sin nombre'),
  }))
}

export async function fetchServiceById(id: string): Promise<ServiceDetail | null> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      service_category: true,
      client_service: {
        include: {
          client: { select: { id: true, name: true } },
          service: { select: { unit: true } },
        },
        orderBy: { created: 'desc' },
      },
      _count: { select: { client_service: true } },
    },
  })

  if (!service) return null

  const base = mapServiceRecord(service)

  const clients = Array.isArray(service.client_service)
    ? service.client_service.map(mapClientAssignment)
    : []

  return { ...base, clients }
}

export async function createService(payload: PersistServicePayload): Promise<ServiceRecord> {
  const now = new Date()
  const service = await prisma.service.create({
    data: {
      id: randomUUID(),
      name: payload.name.trim(),
      description: payload.description?.trim() ?? null,
      unit: payload.unit?.trim() ?? null,
      status: mapStatusToBoolean(payload.status),
      service_category_id: payload.categoryId?.trim() || null,
      created: now,
      updated: now,
    },
    include: {
      service_category: true,
      _count: { select: { client_service: true } },
    },
  })

  return mapServiceRecord(service)
}

export async function updateService(id: string, payload: PersistServicePayload): Promise<ServiceRecord | null> {
  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        name: payload.name.trim(),
        description: payload.description?.trim() ?? null,
        unit: payload.unit?.trim() ?? null,
        status: mapStatusToBoolean(payload.status),
        service_category_id: payload.categoryId?.trim() || null,
        updated: new Date(),
      },
      include: {
        service_category: true,
        _count: { select: { client_service: true } },
      },
    })

    return mapServiceRecord(service)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

export async function deleteService(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const assignments = await tx.client_service.count({ where: { service_id: id } })
    if (assignments > 0) {
      throw new ServiceHasAssignmentsError()
    }

    try {
      await tx.service.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('SERVICE_NOT_FOUND')
      }
      throw error
    }
  })
}

import { randomUUID } from 'node:crypto'
import { prisma } from '../../../config/db.ts'

export type ClientStatus = 'active' | 'inactive' | 'onboarding'
export type ClientType = 'natural' | 'juridica'

type ClientDetailInput = {
  parameterId: string
  value: string
}

type PersistClientPayload = {
  name: string
  status: ClientStatus
  type?: ClientType
  details?: ClientDetailInput[]
}

const toIso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const mapClientStatus = (status: boolean | null | undefined): ClientStatus => {
  if (status === true) return 'active'
  if (status === false) return 'inactive'
  return 'onboarding'
}

const mapClientStatusToBoolean = (status: ClientStatus): boolean | null => {
  if (status === 'active') return true
  if (status === 'inactive') return false
  return null
}

const guessClientType = (
  details: Array<{
    parameterName?: string | null
    value?: string | null
  }>,
): ClientType => {
  const match = details.find((detail) => {
    const name = detail.parameterName?.toLowerCase() ?? ''
    return name.includes('tipo') || name.includes('type')
  })
  const raw = match?.value?.toLowerCase() ?? ''
  if (raw.includes('nat')) return 'natural'
  if (raw.includes('jur')) return 'juridica'
  return 'juridica'
}

const normalizeText = (value: string | null | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

const sanitizeDetails = (details: ClientDetailInput[] | undefined): ClientDetailInput[] => {
  if (!Array.isArray(details)) return []

  const seen = new Set<string>()

  return details
    .map((detail) => ({
      parameterId: detail.parameterId?.trim() ?? '',
      value: detail.value?.trim() ?? '',
    }))
    .filter((detail) => {
      if (!detail.parameterId || detail.value.length === 0) {
        return false
      }
      if (seen.has(detail.parameterId)) {
        return false
      }
      seen.add(detail.parameterId)
      return true
    })
}

export async function fetchClientParameters() {
  const parameters = await prisma.client_parameter.findMany({
    orderBy: { name: 'asc' },
  })

  return parameters.map((parameter) => ({
    id: parameter.id,
    name: normalizeText(parameter.name, 'Parámetro sin nombre'),
  }))
}

const mapClientServiceEntry = (service: any, fallbackClientId: string) => ({
  id: service.id,
  clientId: service.client_id ?? fallbackClientId,
  serviceId: service.service_id ?? '',
  name: normalizeText(service.service?.name ?? null, 'Servicio sin nombre'),
  createdAt: toIso(service.created),
  updatedAt: toIso(service.updated),
  started: toIso(service.started),
  delivery: toIso(service.delivery),
  expiry: toIso(service.expiry),
  frequency: service.frequency ?? null,
  unit: service.unit ?? service.service?.unit ?? null,
  urlApi: service.url_api ?? null,
  tokenApi: service.token_api ?? null,
})

const mapClientRecord = (
  client: any,
  parameterNames: Map<string, string>,
) => {
  const detailEntries = Array.isArray(client.client_details) ? client.client_details : []
  const serviceEntries = Array.isArray(client.client_service) ? client.client_service : []
  const quoteEntries = Array.isArray(client.quote) ? client.quote : []
  const paymentEntries = Array.isArray(client.payment) ? client.payment : []
  const invoiceEntries = Array.isArray(client.invoice) ? client.invoice : []

  const now = new Date()

  const details = detailEntries
    .filter((detail) => Boolean(detail.c_parameter_id))
    .map((detail) => ({
      parameterId: detail.c_parameter_id!,
      parameterName:
        parameterNames.get(detail.c_parameter_id!) ??
        normalizeText(detail.client_parameter?.name ?? null, 'Parámetro sin nombre'),
      value: detail.value ?? '',
    }))

  const services = serviceEntries.map((service) => mapClientServiceEntry(service, client.id))

  const quotes = quoteEntries.map((quote) => ({
    id: quote.id,
    reference: normalizeText(quote.description, quote.id),
    issuedAt: toIso(quote.created),
    amount: toNumber(quote.value),
    status: quote.status === true ? 'aprobada' : quote.status === false ? 'rechazada' : 'pendiente',
  }))

  const payments = paymentEntries.map((payment) => ({
    id: payment.id,
    reference: normalizeText(payment.code, payment.id),
    paidAt: toIso(payment.updated ?? payment.created),
    amount: toNumber(payment.value),
    method: normalizeText(payment.method, 'desconocido'),
  }))

  const invoices = invoiceEntries.map((invoice) => ({
    id: invoice.id,
    number: normalizeText(invoice.description, invoice.id),
    issuedAt: toIso(invoice.created),
    dueAt: toIso(invoice.expiry ?? invoice.updated),
    amount: toNumber(invoice.value),
    status:
      invoice.status === true
        ? 'pagada'
        : invoice.status === false && invoice.expiry && invoice.expiry < now
          ? 'vencida'
          : 'pendiente',
  }))

  const reminders = invoiceEntries.map((invoice) => {
    const dueAt = invoice.expiry ?? invoice.updated ?? invoice.created ?? null
    const dueIso = dueAt ? dueAt.toISOString() : null
    let status: 'pendiente' | 'enviado' | 'confirmado' = 'pendiente'

    if (invoice.status === true) {
      status = 'confirmado'
    } else if (dueAt && dueAt < now) {
      status = 'enviado'
    }

    return {
      id: `reminder-${invoice.id}`,
      concept: normalizeText(invoice.description, `Factura ${invoice.id}`),
      dueAt: dueIso,
      amount: toNumber(invoice.value),
      status,
    }
  })

  return {
    id: client.id,
    name: normalizeText(client.name, 'Cliente sin nombre'),
    type: guessClientType(details),
    status: mapClientStatus(client.status ?? null),
    createdAt: toIso(client.created),
    updatedAt: toIso(client.updated),
    details,
    services,
    quotes,
    payments,
    invoices,
    reminders,
  }
}

export async function fetchClientsWithDetails() {
  const [parameters, clients] = await Promise.all([
    fetchClientParameters(),
    prisma.client.findMany({
      orderBy: { created: 'desc' },
      include: {
        client_details: {
          include: {
            client_parameter: true,
          },
        },
        client_service: {
          include: {
            service: true,
          },
        },
        quote: true,
        payment: true,
        invoice: true,
      },
    }),
  ])

  const parameterNames = new Map(parameters.map((parameter) => [parameter.id, parameter.name]))

  const items = clients.map((client) => mapClientRecord(client as any, parameterNames))

  return { clients: items, parameters }
}

export async function fetchClientById(id: string) {
  const parametersPromise = fetchClientParameters()
  const clientPromise = prisma.client.findUnique({
    where: { id },
    include: {
      client_details: {
        include: {
          client_parameter: true,
        },
      },
      client_service: {
        include: {
          service: true,
        },
      },
      quote: true,
      payment: true,
      invoice: true,
    },
  })

  const servicesPromise = prisma.service.findMany({
    orderBy: { name: 'asc' },
  })

  const [parameters, client, services] = await Promise.all([parametersPromise, clientPromise, servicesPromise])
  if (!client) {
    return null
  }

  const parameterNames = new Map(parameters.map((parameter) => [parameter.id, parameter.name]))
  const mappedClient = mapClientRecord(client as any, parameterNames)
  const serviceCatalog = services.map((service) => ({
    id: service.id,
    name: normalizeText(service.name, 'Servicio sin nombre'),
    description: service.description ?? '',
    defaultFrequency: null as string | null,
    defaultUnit: service.unit ?? null,
    supportsApi: Boolean(service.status),
  }))

  return {
    client: mappedClient,
    parameters,
    serviceCatalog,
  }
}

export type AssignServicePayload = {
  serviceId: string
  started?: string | null
  delivery?: string | null
  expiry?: string | null
  frequency?: string | null
  unit?: string | null
  urlApi?: string | null
  tokenApi?: string | null
}

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const sanitizeOptionalText = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export async function assignServiceToClient(clientId: string, payload: AssignServicePayload) {
  const [client, service] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.service.findUnique({ where: { id: payload.serviceId } }),
  ])

  if (!client) {
    throw new Error('Cliente no encontrado')
  }

  if (!service) {
    throw new Error('Servicio no encontrado')
  }

  const now = new Date()
  const started = parseDate(payload.started) ?? now
  const delivery = parseDate(payload.delivery)
  const expiry = parseDate(payload.expiry)
  const frequency = sanitizeOptionalText(payload.frequency)
  const unit = sanitizeOptionalText(payload.unit) ?? sanitizeOptionalText(service.unit)
  const urlApi = sanitizeOptionalText(payload.urlApi)
  const tokenApi = sanitizeOptionalText(payload.tokenApi)

  const created = await prisma.$transaction(async (tx) => {
    const createdService = await tx.client_service.create({
      data: {
        id: randomUUID(),
        client_id: clientId,
        service_id: service.id,
        created: now,
        updated: now,
        started,
        delivery,
        expiry,
        frequency,
        unit,
        url_api: urlApi,
        token_api: tokenApi,
      },
      include: { service: true },
    })

    await tx.client.update({
      where: { id: clientId },
      data: { updated: now },
    })

    return createdService
  })

  return mapClientServiceEntry(created, clientId)
}

export async function createClient(payload: PersistClientPayload) {
  const details = sanitizeDetails(payload.details)
  const now = new Date()

  const created = await prisma.client.create({
    data: {
      name: payload.name.trim(),
      status: mapClientStatusToBoolean(payload.status),
      created: now,
      updated: now,
      client_details: {
        create: details.map((detail) => ({
          id: randomUUID(),
          c_parameter_id: detail.parameterId,
          value: detail.value,
        })),
      },
    },
  })

  return fetchClientById(created.id)
}

export async function updateClient(id: string, payload: PersistClientPayload) {
  const details = sanitizeDetails(payload.details)

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id },
      data: {
        name: payload.name.trim(),
        status: mapClientStatusToBoolean(payload.status),
        updated: new Date(),
      },
    })

    await tx.client_details.deleteMany({ where: { client_id: id } })

    if (details.length > 0) {
      await tx.client_details.createMany({
        data: details.map((detail) => ({
          id: randomUUID(),
          client_id: id,
          c_parameter_id: detail.parameterId,
          value: detail.value,
        })),
      })
    }
  })

  return fetchClientById(id)
}

export async function deleteClient(id: string) {
  await prisma.$transaction([
    prisma.client_details.deleteMany({ where: { client_id: id } }),
    prisma.client_service.deleteMany({ where: { client_id: id } }),
    prisma.invoice_detail.deleteMany({ where: { invoice: { client_id: id } } }),
    prisma.payment_attachment.deleteMany({ where: { invoice: { client_id: id } } }),
    prisma.quote_attachment.deleteMany({ where: { invoice: { client_id: id } } }),
    prisma.quote_detail.deleteMany({ where: { quote: { client_id: id } } }),
    prisma.invoice.deleteMany({ where: { client_id: id } }),
    prisma.payment.deleteMany({ where: { client_id: id } }),
    prisma.quote.deleteMany({ where: { client_id: id } }),
    prisma.service_usage.deleteMany({ where: { client_id: id } }),
    prisma.log.deleteMany({ where: { client_id: id } }),
    prisma.client.delete({ where: { id } }),
  ])

  return { success: true }
}

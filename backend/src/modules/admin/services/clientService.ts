import { prisma } from '../../../config/db.ts'

export type ClientStatus = 'active' | 'inactive' | 'onboarding'
export type ClientType = 'natural' | 'juridica'

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

export async function fetchClientParameters() {
  const parameters = await prisma.client_parameter.findMany({
    orderBy: { name: 'asc' },
  })

  return parameters.map((parameter) => ({
    id: parameter.id,
    name: normalizeText(parameter.name, 'Parámetro sin nombre'),
  }))
}

const mapClientRecord = (
  client: any,
  parameterNames: Map<string, string>,
) => {
  const detailEntries = Array.isArray(client.client_details) ? client.client_details : []
  const serviceEntries = Array.isArray(client.client_service) ? client.client_service : []
  const quoteEntries = Array.isArray(client.quote) ? client.quote : []
  const paymentEntries = Array.isArray(client.payment) ? client.payment : []
  const invoiceEntries = Array.isArray(client.invoice) ? client.invoice : []

  const details = detailEntries
    .filter((detail) => Boolean(detail.c_parameter_id))
    .map((detail) => ({
      parameterId: detail.c_parameter_id!,
      parameterName:
        parameterNames.get(detail.c_parameter_id!) ??
        normalizeText(detail.client_parameter?.name ?? null, 'Parámetro sin nombre'),
      value: detail.value ?? '',
    }))

  const services = serviceEntries.map((service) => ({
    id: service.id,
    clientId: service.client_id ?? client.id,
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
  }))

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
    dueAt: toIso(invoice.updated),
    amount: toNumber(invoice.value),
    status: invoice.status === false ? 'pendiente' : invoice.status === true ? 'pagada' : 'pendiente',
  }))

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
    reminders: [],
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

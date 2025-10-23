export type ServiceStatus = 'active' | 'inactive';

export type ServiceCategory = {
  id: string;
  name: string;
};

export type ServiceTaxSummary = {
  id: string;
  name: string;
  percentage: number;
};

export type ServiceRecord = {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  price: number | null;
  subtotal: number | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ServiceStatus;
  category: ServiceCategory | null;
  taxOne: ServiceTaxSummary | null;
  taxTwo: ServiceTaxSummary | null;
  createdAt: string | null;
  updatedAt: string | null;
  clientsCount: number;
};

export type ServiceClientAssignment = {
  id: string;
  clientId: string;
  clientName: string;
  started: string | null;
  delivery: string | null;
  expiry: string | null;
  frequency: string | null;
  unit: string | null;
  urlApi: string | null;
  tokenApi: string | null;
};

export type ServiceDetail = ServiceRecord & {
  clients: ServiceClientAssignment[];
};

export type ServiceListPayload = {
  services: ServiceRecord[];
  categories: ServiceCategory[];
};

export type PersistServiceInput = {
  name: string;
  description?: string | null;
  unit?: string | null;
  status: ServiceStatus;
  categoryId?: string | null;
  price: number;
  subtotal?: number | null;
  frequency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  taxOneId?: string | null;
  taxTwoId?: string | null;
};

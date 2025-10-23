export type TaxRecord = {
  id: string;
  name: string;
  description?: string | null;
  rate: number;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PersistTaxInput = {
  name: string;
  description?: string | null;
  rate: number;
  active: boolean;
};

export type QuoteStatus = "draft" | "sent";

export type QuoteLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  laborHours?: number;
};

export type CustomerInput = {
  name: string;
  address: string;
  email?: string;
  phone?: string;
};

export type UserProfile = {
  id: string;
  company_name: string;
  owner_name: string;
  company_address: string;
  company_phone: string | null;
  logo_url: string | null;
  tax_id: string | null;
};

export type QuoteWithCustomer = {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  total_cents: number;
  items: QuoteLineItem[];
  pdf_url: string | null;
  created_at: string;
  customer: {
    name: string;
    address: string;
    email: string | null;
    phone: string | null;
  };
};

export type ProcessQuoteResult = {
  quoteId: string;
  items: QuoteLineItem[];
  totalCents: number;
};

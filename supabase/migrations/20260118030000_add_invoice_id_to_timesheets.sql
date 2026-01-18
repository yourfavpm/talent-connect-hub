ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

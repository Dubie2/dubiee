-- Add image_url to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add logo_url to bank_accounts
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    discount_percentage NUMERIC(5,2) NOT NULL,
    discount_code TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for offers" ON offers;
CREATE POLICY "Public read access for offers" ON offers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access for offers" ON offers;
CREATE POLICY "Admin full access for offers" ON offers FOR ALL USING (true) WITH CHECK (true);

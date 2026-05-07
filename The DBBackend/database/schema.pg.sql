-- PostgreSQL Schema for DecoVentory

-- 1. Materials Table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    condition TEXT DEFAULT 'Good',
    location TEXT DEFAULT 'office store',
    size TEXT,
    colour TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1b. Material Locations Table
CREATE TABLE IF NOT EXISTS material_locations (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chapel Logs Table
CREATE TABLE IF NOT EXISTS chapel_logs (
    id SERIAL PRIMARY KEY,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    materials_used TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Event Decorations Table
CREATE TABLE IF NOT EXISTS event_decorations (
    id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date DATE NOT NULL,
    materials_used TEXT NOT NULL,
    returned BOOLEAN DEFAULT false,
    lost_items TEXT,
    damaged_items TEXT,
    images TEXT, -- Stored as JSON array of URLs
    instagram_link TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. External Borrowers Table
CREATE TABLE IF NOT EXISTS external_borrowers (
    id SERIAL PRIMARY KEY,
    borrower_name TEXT NOT NULL,
    borrower_contact TEXT NOT NULL,
    purpose TEXT NOT NULL,
    borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    returned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. External Borrow Items Table
CREATE TABLE IF NOT EXISTS external_borrow_items (
    id SERIAL PRIMARY KEY,
    borrow_id INTEGER NOT NULL REFERENCES external_borrowers(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    quantity INTEGER NOT NULL,
    returned_quantity INTEGER DEFAULT 0,
    lost_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0
);

-- 6. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    passcode_hash TEXT NOT NULL,
    role TEXT DEFAULT 'executive',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    action_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Quote Requests Table
CREATE TABLE IF NOT EXISTS quote_requests (
    id SERIAL PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    location TEXT NOT NULL,
    event_date DATE NOT NULL,
    items TEXT NOT NULL,
    services TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_chapel_logs_date ON chapel_logs(service_date);
CREATE INDEX IF NOT EXISTS idx_event_decorations_date ON event_decorations(event_date);
CREATE INDEX IF NOT EXISTS idx_external_borrowers_returned ON external_borrowers(returned);
CREATE INDEX IF NOT EXISTS idx_activity_logs_material ON activity_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_material_locations_material ON material_locations(material_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);

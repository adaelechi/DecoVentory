-- 1. Materials Table
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    condition TEXT DEFAULT 'Good',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chapel Logs Table
CREATE TABLE IF NOT EXISTS chapel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    materials_used TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Event Decorations Table
CREATE TABLE IF NOT EXISTS event_decorations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date DATE NOT NULL,
    materials_used TEXT NOT NULL,
    returned BOOLEAN DEFAULT 0,
    lost_items TEXT,
    damaged_items TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. External Borrowers Table
CREATE TABLE IF NOT EXISTS external_borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_name TEXT NOT NULL,
    borrower_contact TEXT NOT NULL,
    purpose TEXT NOT NULL,
    borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    returned BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. External Borrow Items Table
CREATE TABLE IF NOT EXISTS external_borrow_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrow_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    returned_quantity INTEGER DEFAULT 0,
    lost_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    FOREIGN KEY (borrow_id) REFERENCES external_borrowers(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- 6. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passcode_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_chapel_logs_date ON chapel_logs(service_date);
CREATE INDEX IF NOT EXISTS idx_event_decorations_date ON event_decorations(event_date);
CREATE INDEX IF NOT EXISTS idx_external_borrowers_returned ON external_borrowers(returned);
CREATE INDEX IF NOT EXISTS idx_activity_logs_material ON activity_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(action_type);

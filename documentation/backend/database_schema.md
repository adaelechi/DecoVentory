# Database Schema

DecoVentory uses a relational database (SQLite) to store its data. The schema consists of several tables that track materials, usage, and administrative actions.

## 🗄️ Tables

### 1. `materials`
The core table containing all decoration items.
- `id`: Unique identifier (Primary Key).
- `name`: Name of the material.
- `category`: Category (e.g., Fabrics, Lights, Props).
- `total_quantity`: Total number of items owned.
- `available_quantity`: Number of items currently in storage.
- `condition`: State of the material (e.g., Good, Damaged).
- `location`: Primary storage location.
- `size`, `colour`: Descriptive attributes.
- `image_url`: Link to a photo of the item.

### 2. `material_locations`
Tracks where specific quantities of materials are stored.
- `material_id`: Reference to the `materials` table.
- `location_name`: Name of the storage area.
- `quantity`: Number of items at this location.

### 3. `chapel_logs`
Records usage of materials for chapel services.
- `service_date`: Date of the service.
- `service_type`: Type of service (e.g., Sunday, Wedding).
- `materials_used`: JSON string listing materials and quantities.

### 4. `event_decorations`
Tracks materials used for major events.
- `event_name`, `venue`, `event_date`: Basic event details.
- `materials_used`: JSON string listing items.
- `returned`: Boolean flag indicating if items are back in storage.
- `lost_items`, `damaged_items`: JSON strings tracking attrition.

### 5. `external_borrowers` & `external_borrow_items`
Manages items loaned to people outside the unit.
- `borrower_name`, `borrower_contact`: Contact information.
- `borrow_date`, `expected_return_date`: Timeline.
- `items`: Linked via `external_borrow_items` table.

### 6. `activity_logs`
A full audit trail of all inventory movements.
- `action_type`: Type of action (`MATERIAL_ADDED`, `BORROW`, etc.).
- `quantity`: Number of items affected.
- `reference_id`: Link to the related event/borrower/log.

### 7. `quote_requests`
Stores requests from users for material rentals and services.
- `recipient_name`, `location`, `event_date`: Request details.
- `items`, `services`: JSON strings of requested assets.
- `status`: `pending`, `approved`, or `rejected`.

## 🔗 Relationships
- `materials` is the central table.
- `material_locations`, `external_borrow_items`, and `activity_logs` all have a Foreign Key relationship with `materials.id`.
- `external_borrow_items` links to `external_borrowers.id`.

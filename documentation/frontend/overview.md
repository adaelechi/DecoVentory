# Frontend Overview

The DecoVentory frontend is a collection of modular web pages built with vanilla web technologies. Each module is designed for a specific user role or feature.

## 📁 Modules

### 1. Dashboard (`/Dashboard/`)
The entry point for all users. It provides a visual summary of the inventory status, including:
- Total materials and categories.
- Available vs. borrowed items.
- Recent activity highlights.
- Navigation to other sections.

### 2. Admin Panel (`/Admin/`)
A restricted area for executives and administrators. Features include:
- **Quote Requests:** Reviewing and managing requests from the "Rent Materials" section.
- **Resource Management:** Editing or deleting existing inventory items.
- **Decoration Management:** Overseeing recorded events.
- **Activity Logs:** Viewing a detailed history of all system changes.
- **Security:** Updating the access passcodes.

### 3. Recent Decorations (`/RecentDecorations/`)
A public gallery showing past events handled by the decoration unit. It pulls data from the `event_decorations` table and displays event names, venues, and descriptions.

### 4. Rent Materials (`/RentMaterials/`)
An interactive interface for external users to browse the catalog and submit requests for borrowing materials or booking services.

### 5. Add New Resource (`/addNewResource/`)
A dedicated form for adding new items to the inventory. It supports uploading images (via URL) and defining material attributes like size, color, and location.

## 🛠️ Shared Assets (`/assets/`)
To maintain a consistent look and feel, all modules share a common set of assets:
- `global.css`: Base styles, typography, and theme variables (Dark/Light mode).
- `toast.js` / `toast.css`: A custom notification system for displaying success/error messages.
- `logo.jpeg`: The official DecoVentory branding.

## 🔄 Shared Logic (`api.js`)
All pages include `api.js` at the root. This file centralizes:
- **Base URL Configuration:** Automatically switches between local and production API addresses.
- **API Service:** A collection of `async` functions for every backend endpoint.
- **Authentication Helpers:** Functions to manage JWT tokens in `localStorage`.

# DecoVentory API Reference

This document provides a comprehensive list of all API endpoints available in the DecoVentory backend.

**Base URL:** `http://localhost:3000/api` (or your deployed URL)

---

## 🔐 Authentication

All `POST`, `PUT`, and `DELETE` routes require JWT authentication. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

### Login
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate using the executive passcode.
- **Request Body:**
  ```json
  {
    "passcode": "DecoUnit2026"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Login successful"
  }
  ```

### Change Passcode
- **Endpoint:** `POST /auth/change-passcode` (Protected)
- **Description:** Change the executive passcode.
- **Request Body:**
  ```json
  {
    "currentPasscode": "DecoUnit2026",
    "newPasscode": "NewSecurePass123"
  }
  ```

---

## 📦 Materials

### Get All Materials
- **Endpoint:** `GET /materials`
- **Response:** An array of material objects including `id`, `name`, `category`, `total_quantity`, `available_quantity`, `condition`, and `location`.

### Create Material
- **Endpoint:** `POST /materials` (Protected)
- **Request Body:**
  ```json
  {
    "name": "Blue Ribbon",
    "category": "Fabrics",
    "total_quantity": 100,
    "available_quantity": 100,
    "condition": "Good",
    "location": "office store"
  }
  ```

---

## ⛪ Chapel Logs

### Get All Chapel Logs
- **Endpoint:** `GET /chapel-logs`
- **Description:** Retrieve a history of materials used for chapel decorations.

### Create Chapel Log
- **Endpoint:** `POST /chapel-logs` (Protected)
- **Request Body:**
  ```json
  {
    "service_date": "2026-01-12",
    "service_type": "Sunday",
    "materials_used": [
      { "material_id": 1, "name": "White Drape", "quantity": 10 }
    ],
    "notes": "Special anniversary service"
  }
  ```

---

## 🎭 Event Decorations

### Create Event
- **Endpoint:** `POST /events` (Protected)
- **Description:** Records materials used for an event. **Automatically reduces** `available_quantity` in the inventory.

### Mark Event as Returned
- **Endpoint:** `PUT /events/:id/return` (Protected)
- **Description:** Marks items as returned. **Automatically increases** `available_quantity`. Any lost or damaged items will reduce the `total_quantity`.

---

## 🤝 External Borrowers

### Create Borrower
- **Endpoint:** `POST /borrowers` (Protected)
- **Description:** Records an external borrowing request. **Automatically reduces** `available_quantity`.

### Mark Borrower Items as Returned
- **Endpoint:** `PUT /borrowers/:id/return` (Protected)
- **Description:** Marks items as returned by an external borrower.

---

## 📜 Activity Logs

### Get All Activity Logs
- **Endpoint:** `GET /activity-logs`
- **Description:** Retrieve a full audit trail of all inventory movements.
- **Action Types:** `MATERIAL_ADDED`, `CHAPEL_USE`, `EVENT_USE`, `BORROW`, `RETURN`.

---

## ⚠️ Error Responses

- **400 Bad Request:** Missing or invalid parameters.
- **401 Unauthorized:** No token provided or token invalid.
- **404 Not Found:** Resource does not exist.
- **500 Internal Server Error:** Unexpected server failure.

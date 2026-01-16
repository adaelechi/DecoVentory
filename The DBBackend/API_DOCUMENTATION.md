# DecoVentory API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All POST, PUT, and DELETE routes require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Login
**POST** `/auth/login`

Request body:
```json
{
  "passcode": "200026"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Change Passcode
**POST** `/auth/change-passcode` (Protected)

Request body:
```json
{
  "currentPasscode": "DecoUnit2026",
  "newPasscode": "NewSecurePass123"
}
```

---

## Materials

### Get All Materials
**GET** `/materials`

Response:
```json
[
  {
    "id": 1,
    "name": "White Drape",
    "category": "Fabrics",
    "total_quantity": 50,
    "available_quantity": 45,
    "condition": "Good",
    "created_at": "2026-01-07 10:00:00",
    "updated_at": "2026-01-07 10:00:00"
  }
]
```

### Get Material by ID
**GET** `/materials/:id`

### Get Materials by Category
**GET** `/materials/category/:category`

Example: `/materials/category/Fabrics`

### Create Material
**POST** `/materials` (Protected)

Request body:
```json
{
  "name": "Blue Ribbon",
  "category": "Fabrics",
  "total_quantity": 100,
  "available_quantity": 100,
  "condition": "Good"
}
```

### Update Material
**PUT** `/materials/:id` (Protected)

Request body:
```json
{
  "name": "Blue Ribbon",
  "category": "Fabrics",
  "total_quantity": 100,
  "available_quantity": 90,
  "condition": "Good"
}
```

### Delete Material
**DELETE** `/materials/:id` (Protected)

---

## Chapel Logs

### Get All Chapel Logs
**GET** `/chapel-logs`

Response:
```json
[
  {
    "id": 1,
    "service_date": "2026-01-05",
    "service_type": "Sunday",
    "materials_used": [
      {
        "material_id": 1,
        "name": "White Drape",
        "quantity": 10
      }
    ],
    "notes": "Beautiful decoration",
    "created_at": "2026-01-05 08:00:00"
  }
]
```

### Get Chapel Log by ID
**GET** `/chapel-logs/:id`

### Create Chapel Log
**POST** `/chapel-logs` (Protected)

Request body:
```json
{
  "service_date": "2026-01-12",
  "service_type": "Sunday",
  "materials_used": [
    {
      "material_id": 1,
      "name": "White Drape",
      "quantity": 10
    },
    {
      "material_id": 2,
      "name": "Blue Ribbon",
      "quantity": 20
    }
  ],
  "notes": "Special anniversary service"
}
```

### Update Chapel Log
**PUT** `/chapel-logs/:id` (Protected)

### Delete Chapel Log
**DELETE** `/chapel-logs/:id` (Protected)

---

## Event Decorations

### Get All Events
**GET** `/events`

Response:
```json
[
  {
    "id": 1,
    "event_name": "Graduation Ceremony",
    "venue": "Main Auditorium",
    "event_date": "2026-01-15",
    "materials_used": [
      {
        "material_id": 1,
        "name": "White Drape",
        "quantity": 20
      }
    ],
    "returned": false,
    "lost_items": [],
    "damaged_items": [],
    "created_at": "2026-01-07 10:00:00"
  }
]
```

### Get Event by ID
**GET** `/events/:id`

### Create Event
**POST** `/events` (Protected)

Request body:
```json
{
  "event_name": "Convocation",
  "venue": "Great Hall",
  "event_date": "2026-01-20",
  "materials_used": [
    {
      "material_id": 1,
      "name": "White Drape",
      "quantity": 15
    },
    {
      "material_id": 3,
      "name": "LED Lights",
      "quantity": 5
    }
  ]
}
```

### Mark Event as Returned
**PUT** `/events/:id/return` (Protected)

Request body:
```json
{
  "lost_items": [
    {
      "material_id": 3,
      "quantity": 1
    }
  ],
  "damaged_items": [
    {
      "material_id": 1,
      "quantity": 2
    }
  ]
}
```

### Delete Event
**DELETE** `/events/:id` (Protected)

---

## External Borrowers

### Get All Borrowers
**GET** `/borrowers`

Response:
```json
[
  {
    "id": 1,
    "borrower_name": "John Doe",
    "borrower_contact": "0201234567",
    "purpose": "Wedding Decoration",
    "borrow_date": "2026-01-10",
    "expected_return_date": "2026-01-17",
    "returned": false,
    "created_at": "2026-01-10 09:00:00"
  }
]
```

### Get Borrower by ID
**GET** `/borrowers/:id`

Response includes items borrowed:
```json
{
  "id": 1,
  "borrower_name": "John Doe",
  "borrower_contact": "0201234567",
  "purpose": "Wedding Decoration",
  "borrow_date": "2026-01-10",
  "expected_return_date": "2026-01-17",
  "returned": false,
  "items": [
    {
      "id": 1,
      "material_id": 1,
      "material_name": "White Drape",
      "category": "Fabrics",
      "quantity": 10,
      "returned_quantity": 0,
      "lost_quantity": 0,
      "damaged_quantity": 0
    }
  ]
}
```

### Create Borrower with Items
**POST** `/borrowers` (Protected)

Request body:
```json
{
  "borrower_name": "Jane Smith",
  "borrower_contact": "0247654321",
  "purpose": "Church Event",
  "borrow_date": "2026-01-15",
  "expected_return_date": "2026-01-22",
  "items": [
    {
      "material_id": 1,
      "quantity": 15
    },
    {
      "material_id": 2,
      "quantity": 30
    }
  ]
}
```

### Mark Borrower Items as Returned
**PUT** `/borrowers/:id/return` (Protected)

Request body:
```json
{
  "items": [
    {
      "id": 1,
      "returned_quantity": 14,
      "lost_quantity": 1,
      "damaged_quantity": 0
    },
    {
      "id": 2,
      "returned_quantity": 28,
      "lost_quantity": 0,
      "damaged_quantity": 2
    }
  ]
}
```

### Delete Borrower
**DELETE** `/borrowers/:id` (Protected)

---

## Activity Logs

### Get All Activity Logs
**GET** `/activity-logs`

Response:
```json
[
  {
    "id": 1,
    "material_id": 1,
    "material_name": "White Drape",
    "category": "Fabrics",
    "action_type": "BORROW",
    "quantity": 10,
    "reference_id": 1,
    "notes": "Borrowed by John Doe",
    "created_at": "2026-01-10 09:00:00"
  }
]
```

Action types:
- `MATERIAL_ADDED` - New material added to inventory
- `CHAPEL_USE` - Used for chapel decoration
- `EVENT_USE` - Used for event decoration
- `BORROW` - Borrowed by external person
- `RETURN` - Returned to inventory

### Get Logs by Material ID
**GET** `/activity-logs/material/:materialId`

### Get Logs by Action Type
**GET** `/activity-logs/action/:actionType`

Example: `/activity-logs/action/BORROW`

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**
```json
{
  "error": "Description of what went wrong"
}
```

**401 Unauthorized**
```json
{
  "error": "No token provided"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Server error"
}
```

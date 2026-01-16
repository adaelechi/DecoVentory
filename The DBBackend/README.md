# 🎨 DecoVentory Backend API

Complete REST API for managing decoration materials inventory, chapel decorations, event decorations, and external borrowing.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize database with sample data
npm run init-db

# 3. Start server
npm start
```

Server runs on: `http://localhost:3000`

**Default Passcode**: `DecoUnit2026`

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Free hosting options (Render, Railway, Fly.io)
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Full project overview
- **[api-client.js](api-client.js)** - Ready-to-use JavaScript client for frontend

---

## 🔑 Key Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Public + Protected Routes** - GET public, POST/PUT/DELETE protected  
✅ **Automatic Inventory Tracking** - Borrows reduce, returns increase quantities  
✅ **Activity Logging** - Complete audit trail of all movements  
✅ **7 Database Tables** - Materials, Chapel Logs, Events, Borrowers, etc.  
✅ **30+ API Endpoints** - Full CRUD operations  
✅ **MVC Architecture** - Professional code organization  
✅ **Production Ready** - Error handling, validation, security  

---

## 🛣️ Main API Routes

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/change-passcode` - Change executive passcode

### Materials (Public GET, Protected Modify)
- `GET /api/materials` - View all materials
- `POST /api/materials` - Add new material 🔒
- `PUT /api/materials/:id` - Update material 🔒

### Chapel Logs
- `GET /api/chapel-logs` - View chapel decoration history
- `POST /api/chapel-logs` - Log chapel decoration 🔒

### Events
- `GET /api/events` - View event decorations
- `POST /api/events` - Create event (auto-reduces inventory) 🔒
- `PUT /api/events/:id/return` - Mark returned (auto-restores inventory) 🔒

### Borrowers
- `GET /api/borrowers` - View borrowing records
- `POST /api/borrowers` - Create borrower with items (auto-reduces inventory) 🔒
- `PUT /api/borrowers/:id/return` - Mark returned (auto-restores inventory) 🔒

### Activity Logs
- `GET /api/activity-logs` - View all activity history

🔒 = Requires JWT token

---

## 🔐 Authentication

Protected routes need JWT token in header:
```bash
Authorization: Bearer <your_token>
```

Get token by logging in with passcode at `/api/auth/login`

---

## 🌐 Deploy for Free

Best options:
1. **Render.com** (recommended) - 750 hours/month free
2. **Railway.app** - $5 credit monthly, no sleep
3. **Fly.io** - 3 free VMs

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 📁 Project Structure

```
The DBBackend/
├── models/          - Database models (7 files)
├── controllers/     - Business logic (6 files)
├── routes/          - API routes (6 files)
├── middleware/      - JWT authentication
├── database/        - SQLite connection + schema
├── server.js        - Express server
└── Documentation    - 5 comprehensive guides
```

---

## 💻 Development

```bash
npm run dev    # Start with auto-reload (nodemon)
npm start      # Start production server
npm run init-db # Initialize/reset database
```

---

## 📖 Example Usage

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ passcode: 'DecoUnit2026' })
});
const { token } = await response.json();

// Get materials (public)
const materials = await fetch('http://localhost:3000/api/materials');

// Create material (protected)
const newMaterial = await fetch('http://localhost:3000/api/materials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Red Carpet',
    category: 'Fabrics',
    total_quantity: 10
  })
});
```

Or use the included `api-client.js` for easier integration!

---

## 🎯 Built With

- **Node.js** + **Express** - Server framework
- **SQLite** - Embedded database
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin support

---

## 📞 Need Help?

Check the documentation files or review:
- API examples in [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Setup guide in [QUICKSTART.md](QUICKSTART.md)
- Deployment steps in [DEPLOYMENT.md](DEPLOYMENT.md)

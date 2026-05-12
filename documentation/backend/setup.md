# Backend Setup & Installation

Follow these steps to set up and run the DecoVentory backend on your local machine.

## 📋 Prerequisites
- **Node.js** (v14 or higher recommended)
- **npm** (comes with Node.js)

## 🛠️ Installation Steps

1. **Navigate to the backend directory:**
   ```bash
   cd "The DBBackend"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   This command will create the SQLite database file and populate it with the necessary tables and sample data.
   ```bash
   npm run init-db
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `The DBBackend` directory and add the following configurations (adjust as needed):
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   DEFAULT_PASSCODE=DecoUnit2026
   ```
   > [!IMPORTANT]
   > Ensure you change the `JWT_SECRET` and `DEFAULT_PASSCODE` before deploying to a production environment.

## 🚀 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once started, the API will be available at `http://localhost:3000/api`.

## 🧪 Testing the API
You can test the endpoints using tools like **Postman** or **Insomnia**. Refer to the [API Reference](./api_reference.md) for a list of available endpoints.

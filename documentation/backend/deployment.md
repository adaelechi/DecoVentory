# Deployment Guide

This guide covers the options and steps for deploying the DecoVentory system to a production environment for free.

## 🏢 Backend Hosting

### 1. Render.com (Recommended)
Render is a great choice for Node.js applications with SQLite.
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:** Set `JWT_SECRET`, `NODE_ENV=production`, and `DEFAULT_PASSCODE`.
- **Note:** The free tier spins down after 15 minutes of inactivity. Use a service like **UptimeRobot** to keep it awake.

### 2. Railway.app
Railway offers a generous free tier and easy GitHub integration. It doesn't sleep, making it more responsive than Render's free tier.

---

## 🌐 Frontend Hosting

### Vercel
Vercel is the best platform for hosting the static frontend files (HTML/CSS/JS).
- **Steps:** Import your GitHub repo, select the root directory, and deploy.
- **Configuration:** Ensure your `api.js` is updated to point to your deployed backend URL.

---

## 🛠️ Full-Stack Configuration

After deploying the backend, you **must** update the API URL in the frontend:

1. Open `api.js` in the root directory.
2. Update the production URL:
   ```javascript
   const API_BASE_URL = isLocalhost 
     ? 'http://localhost:3000/api' 
     : 'https://your-backend-app.onrender.com/api';
   ```

---

## 💾 Database Persistence (Important!)
Most free hosting platforms use ephemeral storage, meaning your SQLite database will be wiped whenever the server restarts.

**Solutions:**
- **Railway/Render Disk:** Attach a persistent disk (may require a small fee).
- **PostgreSQL:** Both Railway and Render offer free PostgreSQL databases. If you expect high data volume or need long-term reliability, consider migrating to PostgreSQL (requires code changes in `database.js`).

---

## 🛡️ Security Checklist
- [ ] Change `JWT_SECRET` to a long, random string.
- [ ] Set a strong `DEFAULT_PASSCODE`.
- [ ] Set `NODE_ENV` to `production`.
- [ ] Ensure all API communication is over **HTTPS**.
- [ ] Use **CORS** settings to allow only your frontend domain to access the API.

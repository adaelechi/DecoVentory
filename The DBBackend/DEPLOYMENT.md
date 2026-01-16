# 🚀 DecoVentory Backend Deployment Guide

## Free Hosting Options

### 1. **Render.com** (Recommended)
- ✅ Free tier includes 750 hours/month
- ✅ Automatic deployments from GitHub
- ✅ SQLite works out of the box
- ✅ Free SSL certificate

**Steps:**
1. Push code to GitHub
2. Sign up at [render.com](https://render.com)
3. Create New > Web Service
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Add Environment Variables**: Copy from `.env`
6. Click "Create Web Service"

**Note**: Free tier spins down after 15 minutes of inactivity.

---

### 2. **Railway.app**
- ✅ $5 free credit monthly
- ✅ No sleep/spin-down
- ✅ Easy deployment

**Steps:**
1. Push code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. New Project > Deploy from GitHub
4. Select your repository
5. Add environment variables
6. Deploy!

---

### 3. **Fly.io**
- ✅ Free tier: 3 shared VMs
- ✅ Good for SQLite
- ✅ Global deployment

**Steps:**
1. Install Fly CLI: `brew install flyctl` (macOS)
2. Sign up: `fly auth signup`
3. In your project directory:
```bash
fly launch
fly secrets set JWT_SECRET=your_secret
fly secrets set DEFAULT_PASSCODE=your_passcode
fly deploy
```

---

### 4. **Glitch.com**
- ✅ Completely free
- ✅ Easy to use
- ⚠️ Sleeps after 5 minutes (wakes on request)

**Steps:**
1. Go to [glitch.com](https://glitch.com)
2. New Project > Import from GitHub
3. Paste your repository URL
4. Add `.env` file in Glitch editor
5. Your app is live!

---

## Frontend Hosting Options

### **Vercel** (Recommended for Static Sites)
- ✅ Free tier
- ✅ Automatic deployments
- ✅ Global CDN

**Steps:**
1. Push frontend to GitHub
2. Sign up at [vercel.com](https://vercel.com)
3. Import your repository
4. Configure build settings
5. Deploy!

### **Netlify**
- ✅ Free tier
- ✅ Continuous deployment
- ✅ Form handling

---

## Full Stack Deployment

### Option 1: Separate Deployment
- **Backend**: Render/Railway/Fly.io
- **Frontend**: Vercel/Netlify
- Update frontend API calls to point to backend URL

### Option 2: Same Platform
Deploy everything to Render or Railway:
- Backend as Web Service
- Frontend as Static Site

---

## Important: Update Frontend API URLs

After deploying backend, update your frontend JavaScript files:

```javascript
// Old
const API_URL = 'http://localhost:3000/api';

// New
const API_URL = 'https://your-backend-url.onrender.com/api';
```

---

## Database Persistence

**Important**: Free tier hosting may reset your SQLite database on restarts.

**Solutions**:
1. **Use PostgreSQL** (free on Render/Railway)
2. **Backup regularly** to GitHub
3. **Use persistent storage** (paid)

**For Production**: Consider migrating to PostgreSQL:
- Render offers free PostgreSQL
- Railway offers free PostgreSQL
- Minor code changes needed

---

## Security Checklist Before Deployment

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `DEFAULT_PASSCODE`
- [ ] Set `NODE_ENV=production`
- [ ] Add your frontend URL to CORS whitelist
- [ ] Never commit `.env` file (it's in `.gitignore`)
- [ ] Use HTTPS only in production

---

## Monitoring

**Free Monitoring Tools**:
- **Uptime Robot**: Ping your API every 5 minutes to prevent sleep
- **Better Uptime**: Health checks and alerts
- **Render Dashboard**: Built-in logs and metrics

---

## Recommended Setup

**Best Free Combination**:
1. **Backend**: Railway.app or Render.com
2. **Frontend**: Vercel
3. **Monitoring**: UptimeRobot

This gives you:
- Reliable backend hosting
- Fast frontend delivery
- No sleep issues (with monitoring)
- All free!

---

## Need Help?

Check the documentation:
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Fly.io Docs](https://fly.io/docs)

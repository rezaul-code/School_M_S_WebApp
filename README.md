# School_M_S_WebApp

A school management system web application built with React, TypeScript, and Vite.

## Setup & Configuration

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Configure Backend API URL

This project uses environment variables to configure the backend API URL.

#### Development Setup

For **local development**, edit `.env.development`:

```env
# .env.development
VITE_API_BASE_URL=http://localhost:3000
```

Replace `http://localhost:3000` with your actual backend server address (e.g., `http://localhost:5000`, `http://localhost:8000`, etc.).

**How it works:**
- Vite's dev server will automatically proxy all `/api/*` requests to this URL
- This avoids CORS issues during development
- The login and all API calls will be routed through the proxy

#### Production Setup

For **production builds**, ensure `.env.production` has the correct backend URL:

```env
# .env.production
VITE_API_BASE_URL=https://api.example.com
```

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

### 4. Build for Production

```bash
npm run build
# or
bun build
```

## Troubleshooting

### Login API Errors

If you see login failures or API errors:

1. **Check backend is running** — Ensure your backend server is running on the correct port
2. **Verify API URL** — Check `.env.development` has the correct `VITE_API_BASE_URL`
3. **CORS issues** — If the backend is not proxied, ensure it has CORS headers configured:
   ```
   Access-Control-Allow-Origin: http://localhost:8080
   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```
4. **Check DevTools** — Open browser DevTools (F12) → Network tab to see actual API request failures

### Expected Login API
- **Endpoint:** `/api/auth/login`
- **Method:** POST
- **Body:** `{ "email": "user@example.com", "password": "password" }`
- **Response:** `{ "token": "...", "user": {...} }`

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint
- `npm run test` — Run tests
- `npm run test:watch` — Watch mode for tests
# Instagram Clone — TechPrysm Evaluation Project

Full-stack Instagram-style app: React + Tailwind (frontend), Node/Express + MongoDB (backend),
Cloudinary (media), Socket.IO (real-time).

## Architecture

```
React (Vite) ──axios/socket.io-client──> Express API ──mongoose──> MongoDB
                                              │
                                              └──> Cloudinary (media storage)
```

Backend layout:
```
backend/
  config/       # db + cloudinary setup
  controllers/  # request handlers, one file per feature
  middlewares/  # auth guard, error handler
  models/       # mongoose schemas
  routes/       # express routers, one per feature
  validators/   # express-validator rule sets
  socket/       # socket.io event handlers (Step 14+)
  utils/        # helpers (token generation, etc.)
```

Frontend layout:
```
frontend/src/
  pages/       # route-level components (Login, Register, Home, ...)
  components/  # reusable UI pieces
  contexts/    # AuthContext, etc.
  services/    # axios instance
  hooks/       # custom hooks (added as needed)
  layouts/     # shared page shells (added as needed)
```

## Local setup

**Backend**
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm install
npm run dev             # http://localhost:5000
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Progress (update this checklist as you build)

- [x] Step 1-2 — Requirements + architecture
- [x] Step 3 — Project setup (backend + frontend scaffolds)
- [x] Step 4 — Authentication (register/login/logout/me, JWT via httpOnly cookie)
- [ ] Step 5 — User profile (view/edit, public/private, avatar upload)
- [ ] Step 6 — Follow system (follow/unfollow, requests for private accounts)
- [ ] Step 7 — Cloudinary upload service
- [ ] Step 8 — Posts (CRUD)
- [ ] Step 9 — Likes
- [ ] Step 10 — Comments
- [ ] Step 11 — Replies + comment likes
- [ ] Step 12 — Stories (10-min expiry, soft delete, cron)
- [ ] Step 13 — Feed
- [ ] Step 14 — Socket.IO real-time
- [ ] Step 15 — Frontend polish (loading/empty/error states, responsiveness)
- [ ] Step 16 — Deployment (Render + Vercel + Atlas)
- [ ] Step 17 — README finalization (add deployment links, demo credentials, screenshots)
- [ ] Bonus — Direct messaging

## API implemented so far

| Method | Route             | Access  | Description                  |
|--------|--------------------|---------|-------------------------------|
| POST   | /api/auth/register | Public  | Create account, sets auth cookie |
| POST   | /api/auth/login    | Public  | Log in, sets auth cookie      |
| POST   | /api/auth/logout   | Private | Clears auth cookie            |
| GET    | /api/auth/me       | Private | Returns current logged-in user|

## Assumptions

- JWT is stored in an httpOnly cookie (not localStorage) to reduce XSS risk; a copy is
  also returned in the response body for Postman/API testing convenience.
- Passwords are hashed with bcrypt (10 salt rounds) before storage.

## Deployment

_To be filled in after Step 16 — add live frontend/backend URLs here._

## Demo credentials

_To be filled in before submission._

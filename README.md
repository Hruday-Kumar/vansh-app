<div align="center">

# 🪷 Vansh - Family Heritage App

### *वंश - Preserving Family Legacies Across Generations*

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>A beautiful family heritage preservation app that helps you document, share, and preserve your family's stories, memories, traditions, and wisdom for generations to come.</strong>
</p>

---

</div>

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 **Time River** | A chronological feed of family moments |
| 📸 **Smriti (Memories)** | Photo & video gallery with AI-powered tagging |
| 🎙️ **Katha (Stories)** | Voice recordings of family stories and wisdom |
| 🌳 **Vriksha (Family Tree)** | Interactive family tree visualization |
| 🪔 **Parampara (Traditions)** | Document family traditions and recipes |
| 💌 **Vasiyat (Wisdom Vault)** | Time-locked messages for future generations |
| ⚙️ **Settings** | User profile and preferences |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Configure Environment

Create/edit `.env` in the `backend` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=vansh_db
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Setup Database

```bash
cd backend
npm run db:setup    # Creates all tables
npm run db:seed     # Adds sample data
```

### 5. Start Backend Server

```bash
cd backend
npx tsx watch src/index.ts
```

The API will be available at `http://localhost:3000`

### 6. Start Expo App

In a new terminal:

```bash
npx expo start
```

Then:
- Press `w` for web
- Press `a` for Android
- Press `i` for iOS

## 🔐 Demo Login

After seeding the database, use these credentials:

- **Email:** `arjun@example.com`
- **Password:** `vansh123`

## 📁 Project Structure

```
vansh-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home (Time River)
│   │   ├── smriti.tsx     # Memories
│   │   ├── katha.tsx      # Voice Stories
│   │   ├── vriksha.tsx    # Family Tree
│   │   ├── parampara.tsx  # Traditions
│   │   ├── vasiyat.tsx    # Wisdom Vault
│   │   └── explore.tsx    # Settings
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root layout
├── backend/               # Express.js API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, uploads, etc.
│   │   ├── services/      # Gemini AI service
│   │   └── scripts/       # DB setup & seed
│   └── package.json
├── src/
│   ├── components/        # Reusable UI components
│   ├── features/          # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client
│   ├── state/             # Zustand stores
│   ├── theme/             # Colors, spacing, typography
│   └── types/             # TypeScript definitions
└── package.json
```

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | Create account |
| GET | `/api/families` | Get family info |
| GET | `/api/members` | List family members |
| POST | `/api/members` | Add new member |
| GET | `/api/memories` | List memories |
| POST | `/api/memories` | Upload memory |
| GET | `/api/kathas` | List voice stories |
| POST | `/api/kathas` | Upload katha |
| GET | `/api/vasiyats` | List wisdom messages |
| POST | `/api/vasiyats` | Create vasiyat |

## 🎨 Design Philosophy

Vansh uses a **Digital Sanskriti** design language inspired by:

- 🏛️ Temple architecture and sacred geometry
- 🧵 Traditional Indian textiles (Kanchipuram silks)
- 📜 Aged manuscripts and palm leaf textures
- 🌺 Sacred colors (vermilion, turmeric, lotus pink)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

---

## 🚀 Production Deployment

### Environment Variables

Create a `.env` file with the following production settings:

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=vansh_db
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_ORIGINS=https://your-domain.com
```

### Database Migration

```bash
cd backend
mysql -u root -p vansh_db < sql/migrations/001_initial_schema.sql
mysql -u root -p vansh_db < sql/migrations/002_add_user_sessions.sql
mysql -u root -p vansh_db < sql/migrations/003_production_indexes.sql
```

### Production Features

| Feature | Description |
|---------|-------------|
| 🔒 **Security** | Helmet.js, CORS, rate limiting |
| 📊 **Logging** | Morgan request logging |
| 🗜️ **Performance** | Gzip compression |
| 💾 **Database** | Connection pooling, retry logic |
| ⚡ **Graceful Shutdown** | Proper cleanup on SIGTERM/SIGINT |

---

## 📄 License

MIT License - feel free to use this for your own family!

---

Made with 🪷 for families everywhere
<div align="center">

**[⬆ Back to Top](#-vansh---family-heritage-app)**

</div>
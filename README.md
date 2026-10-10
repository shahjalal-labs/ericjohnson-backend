# 🎮 PlaySpark — Interactive Social Matchmaking & Real-Time Multiplayer Trivia Gaming Engine

![Architecture Banner](./assets/banner.svg)

<p align="center">
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e47c33a4-27b8-472e-a2a1-dfbd24046b66" target="_blank">
    <img src="https://run.pstmn.io/button.svg" alt="View in Postman" />
  </a>
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e47c33a4-27b8-472e-a2a1-dfbd24046b66" target="_blank">
    <img src="https://img.shields.io/badge/Postman-Instant_Live_API_Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Live API Documentation" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Multiplayer_Game-6366F1?style=for-the-badge&logo=gamepad-2&logoColor=white" alt="Multiplayer_Game" />
  
</p>

---

## 📌 Executive Overview

**PlaySpark Server** (Eric Johnson Backend) is a high-energy social matchmaking and real-time multiplayer gaming backend. Engineered with **Node.js, TypeScript, Express, Socket.io, and Prisma ORM**, the platform breaks the ice between potential matches: users connect through **algorithmic matchmaking** (distance, lifestyle habits, relationship intentions), then engage in **live multi-round trivia and icebreaker gaming sessions** (`GameSession`, `GameEvent`) with instant buzzer submissions, round eliminations, and real-time leaderboard scoring via WebSockets.

---

## 🚀 Key Architectural & Domain Capabilities

- **Real-Time Multiplayer Game Engine**: Low-latency Socket.io game state coordinator handling game lobbies, countdown timers, round events, and winner adjudication.
- **Interactive Icebreaker Trivia**: Dynamic multi-round question engines (`SUBMIT_ANSWER`, `ELIMINATE`, `ROUND_START`) encouraging interactive date conversations.
- **Proximity-Aware Matchmaking**: Multi-dimensional discovery filter analyzing geographic radius, age brackets, relationship goals, and lifestyle vices.
- **Low-Latency WebSocket Chat**: 1-on-1 direct messaging rooms (`Room`, `Message`) with delivery receipts, typing events, and encrypted media attachments.
- **Defensive Safety & Privacy**: Block/report safety features, visibility toggles per profile attribute, and secure tokenized authentication.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore ericjohnson-backend in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e47c33a4-27b8-472e-a2a1-dfbd24046b66)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (ready for Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | Phone/email onboarding, Google/Apple login, JWT session tokens |
| **Profile & Preferences** | `/api/v1/user` | Gallery photos, intentions, lifestyle vices, distance discovery settings |
| **Matchmaking** | `/api/v1/match` | Swipe discovery feed, mutual match handshakes, mutual connection queue |
| **Multiplayer Game Sessions** | `/api/v1/gameSession` | Create game lobbies, start rounds, submit answers, evaluate scores |
| **Real-Time Messaging** | `/api/v1/message` | Socket.io chat conversations, attachment sharing, unread counts |

---

## 📂 Project Architecture

```plaintext
ericjohnson-backend/
├── assets/
│   └── banner.svg               # Architectural visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain feature modules
│   │   └── routes/              # Centralized route registration
│   ├── config/                  # Environment & external service configurations
│   └── server.ts                # Application bootstrapper
├── prisma/
│   └── schema.prisma            # Prisma database schema definition
├── .env.example                 # Sanitized environment template
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **Database**: MongoDB or PostgreSQL (as specified in `schema.prisma`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shahjalal-labs/ericjohnson-backend.git
cd ericjohnson-backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and engineered by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

# ❤️ Eric Johnson Social — Real-Time Matchmaking & WebSocket Chat API

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
  <img src="https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Social_Match-EC4899?style=for-the-badge&logo=heart&logoColor=white" alt="Social_Match" />
  
</p>

---

## 📌 Executive Overview

Eric Johnson Social powers contemporary dating and social matchmaking platforms, delivering low-latency WebSockets instant messaging, geolocated profile discovery, mutual match handshakes, and user blocking/reporting.

---

## 🚀 Key Architectural Highlights

- **Real-Time Chat Engine**: Low-latency WebSocket bi-directional messaging with delivery & read receipts.
- **Mutual Matching Algorithm**: Swipe/match logic triggering instant mutual connection handshakes.
- **Geolocation Discovery**: Proximity-based discovery filters with age, distance, and interest criteria.
- **Privacy & Safety**: Encrypted photo attachments, instant unmatching, user reporting, and shadowbanning.
- **Presence Detection**: Real-time online/offline status signals and typing indicators.

---

## 📬 API Documentation & Interactive Postman Collection

The complete REST API specification is published in our public Postman showcase workspace:

* 🌐 **Instant Live API Documentation**: [Explore ericjohnson-backend in Postman (Instant Web View)](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-e47c33a4-27b8-472e-a2a1-dfbd24046b66)
* 📁 **Local Postman File**: [`docs/postman_collection.json`](./docs/postman_collection.json) (import directly into Postman Desktop or Newman CLI).

### Core Endpoint Modules

| Module | Base Route | Key Capabilities |
|---|---|---|
| **Authentication** | `/api/v1/auth` | Phone/Email onboarding, selfie verification, JWT rotation |
| **Profiles** | `/api/v1/user` | Bio, photos, dating preferences, lifestyle badges |
| **Matches** | `/api/v1/match` | Swipe discovery feed, match confirmation, pass/like queue |
| **Messages** | `/api/v1/message` | Direct messaging history, attachment sharing, unread counts |
| **WebSockets** | `/api/v1/socket` | Live socket handshakes, presence broadcasts, message events |

---

## 📂 Project Architecture

```plaintext
ericjohnson-backend/
├── assets/
│   └── banner.svg               # Project architecture visual banner
├── docs/
│   └── postman_collection.json  # Full Postman API collection v2.1
├── src/
│   ├── app/
│   │   ├── middlewares/         # Global error handlers, auth & validation guards
│   │   ├── modules/             # Domain-driven feature modules
│   │   └── routes/              # Centralized route aggregator
│   ├── config/                  # Environment & external service configurations
│   └── server.ts                # Application bootstrapper & HTTP server
├── prisma/
│   └── schema.prisma            # Database schema definition
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

### 2. Environment Configuration
Copy the provided `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Prisma Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 👨‍💻 Engineering & Authorship

Developed and maintained by **Md. Shahjalal**.

* **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)
* **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

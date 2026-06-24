# 🚗 AI Vehicle Number Plate Recognition (ANPR) System

![ANPR System](https://img.shields.io/badge/AI-Powered-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-v24-brightgreen)

> A full-stack AI-powered Automatic Number Plate Recognition system built as a final year project at Rajiv Gandhi University of Knowledge and Technologies.

---

## 👩‍🎓 Project Info

| Field | Details |
|-------|---------|
| **University** | Rajiv Gandhi University of Knowledge and Technologies |
| **Department** | Computer Science & Engineering |
| **Graduation Year** | 2025 |
| **Project Type** | Final Year Project |

---

## 📌 About the Project

The **ANPR System** uses cutting-edge AI vision technology to automatically detect and extract license plate information from vehicle images and videos. It provides a clean, modern web interface for uploading images, viewing results, and managing detection history.

---

## ✨ Features

- 🖼️ **Image Upload** — Drag & drop or select JPG/PNG images
- 🤖 **AI Plate Detection** — Powered by Groq's Llama AI (free & fast)
- 📊 **Confidence Scoring** — Every detection includes accuracy percentage
- 🎯 **Bounding Box** — Visual overlay showing detected plate region
- 🎬 **Video Support** — Frame-by-frame plate detection from videos
- 📜 **Detection History** — Full dashboard with search & filters
- 📥 **Export** — Download results as CSV or JSON
- 🗄️ **Database Storage** — All detections saved to MySQL database

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, tRPC |
| **Database** | MySQL (Drizzle ORM) |
| **AI Model** | Groq API (Llama 4 Scout) |
| **Build Tool** | Vite |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm
- MySQL database

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Bhavyachandrika/anpr-system.git
cd anpr-system
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
DATABASE_URL=mysql://username:password@host:3306/dbname
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secret_key
VITE_OAUTH_PORTAL_URL=http://localhost:3000
VITE_APP_ID=anpr-college
```

4. **Run the development server**
```bash
pnpm dev
```

5. **Open your browser**
```
http://localhost:3000
```

---

## 📸 Screenshots

### Home Page
> Clean, modern landing page with key features overview

### Upload Page
> Drag & drop interface with real-time image preview

### Result Page
> Detected plate number with confidence score and bounding box visualization

### Dashboard
> Full history with search, filter, sort, and export functionality

---

## 🔑 Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Click **API Keys** → **Create API Key**
4. Copy the key and add it to your `.env` file

---

## 🗄️ Database Setup

1. Create a free MySQL database at [freesqldatabase.com](https://www.freesqldatabase.com)
2. Use the phpMyAdmin panel to run the SQL setup
3. Add the connection URL to your `.env` file

---

## 📁 Project Structure

```
anpr-system/
├── client/               # React frontend
│   └── src/
│       ├── pages/        # Home, Upload, Result, Dashboard
│       ├── components/   # Reusable UI components
│       └── lib/          # tRPC client, utilities
├── server/               # Express backend
│   ├── _core/            # LLM, auth, storage, plate detection
│   └── routers.ts        # tRPC API routes
├── drizzle/              # Database schema & migrations
├── shared/               # Shared types & constants
└── .env                  # Environment variables
```

---

## 🧠 How It Works

1. User uploads a vehicle image
2. Image is sent to the backend as base64
3. Groq's Llama AI vision model analyzes the image
4. AI returns plate number, confidence score, and bounding box coordinates
5. Image is saved to local storage
6. Detection record is saved to MySQL database
7. Results are displayed on the Result page

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) for the free AI API
- [Shadcn/UI](https://ui.shadcn.com) for beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team) for database management
- [tRPC](https://trpc.io) for end-to-end type safety

---

*Built with ❤️ for Rajiv Gandhi University of Knowledge and Technologies — CSE 2025*

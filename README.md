# ElimuBuddy – AI + Human Hybrid Study Companion

[![Project Status](https://img.shields.io/badge/status-active-success)](https://github.com/Wangarijane/elimu-buddy)
**Hackathon:** Vibe Coding 2025 | **SDG Goal:** 4 – Quality Education

ElimuBuddy is a **Kenyan AI + Human hybrid study platform** that helps learners, parents, and educators navigate the CBC curriculum. The platform integrates AI-powered learning, expert guidance, and tiered monetization to provide accessible, real-world educational support.

---

## 🎯 Core Purpose

1. **AI-powered learning support** → Students ask questions and receive instant AI-generated answers based on the official CBC curriculum.
2. **Expert-powered guidance** → Verified educators can answer questions, earn payments via **M-Pesa**, and guide students.
3. **Affordable access for parents & learners** → Free and premium subscription tiers ensure inclusivity.

---

## 💻 Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Vite, React Router
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT

**APIs & Integrations:**

* **Hugging Face AI** → AI question answering & study guidance
* **M-Pesa API & Instasend** → Payment collection & expert payouts
* **Twilio & SMS/Push notifications** → Real-time alerts
* **Email notifications** → Updates for payments and progress

**Dev & Debug Tools:**

* **Lovable** → Prompt engineering & project scaffolding
* **Cursor AI** → Backend generation
* **DeepSeek & ChatGPT** → Debugging and code optimization

---

## 📦 Folder Structure

### Frontend

```
frontend/
├─ public/
├─ src/
│  ├─ assets/           # Images & logos
│  ├─ components/       # UI components: Header, Footer, Hero, Features, Pricing
│  ├─ contexts/         # AuthContext, LanguageContext
│  ├─ hooks/            # Custom hooks: use-mobile, use-toast
│  ├─ lib/              # Utilities
│  ├─ pages/            # App pages: Dashboard, Chat, Login, Signup, Experts
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ package.json
├─ vite.config.ts
├─ tailwind.config.ts
└─ pnpm-lock.yaml
```

### Backend

```
backend/
├─ controllers/         # Business logic for users, questions, answers, payments, chat
├─ middleware/          # Auth, validation, error handling, rate limiting
├─ models/              # MongoDB schemas
├─ routes/              # Express routes
├─ utils/               # Helpers: AI, JWT, email, M-Pesa, Twilio
├─ .env
├─ server.js
├─ package.json
└─ pnpm-lock.yaml
```

---

## 🌟 Features

### Frontend

* **Landing Page** → Hero, Features, Pricing, Footer sections
* **Authentication** → Signup/Login with role-based dashboards
* **Chat System** → Real-time chat between students and experts
* **Responsive Design** → Mobile-first

### Backend

* **REST API** → CRUD for users, questions, answers, payments, subscriptions, notifications, chat
* **JWT Authentication** → Role-based access
* **Payment Handling** → M-Pesa API, Instasend
* **AI Integration** → Hugging Face-powered curriculum-aware AI

---

## 💰 Monetization

* **Free Plan:** 5 AI questions/day

* **Premium Plans:**

  * Ksh 300/month → 50 AI questions + group study rooms
  * Ksh 500/month → Unlimited AI questions + priority expert matching
  * Ksh 1500/month → Family plan (up to 5 learners)

* **Expert Payment:** Per answered question, withdrawable via M-Pesa

* **Payment Methods:** M-Pesa STK Push & Instasend

---

## 🤖 AI & Prompt Engineering

The project leveraged **prompt engineering** in two stages:

### 1. Initial Prompt Creation (ChatGPT)

The following prompt was generated in ChatGPT and then fed into **Lovable** for application generation:

> **You are building a complete MERN stack, JavaScript/JSX web platform called *ElimuBuddy*. This platform is a Kenyan AI + Human hybrid study buddy that helps learners, parents, and educators navigate the CBC curriculum. It must be fully functional with no placeholders, no dummy content, and no fake testimonials. Use real CBC data.**
>
> ---
>
> #### 🎯 Core Purpose
>
> ElimuBuddy provides:
>
> 1. **AI-powered learning support** → students can ask questions and get instant answers based on the official CBC curriculum in Kenya.
> 2. **Expert-powered guidance** → verified subject experts (teachers/tutors) can sign up, view student questions, pick which ones to answer, and get paid.
> 3. **Affordable access for parents & learners** → tiered monetization ensures inclusivity, from free access to premium plans.
>
> ---
>
> #### 📚 CBC Curriculum Data (REAL, not dummy)
>
> *(Full CBC curriculum per grade and subject included here)*
>
> ---
>
> #### 💰 Monetization Strategy
>
> *(Free and premium tiers, expert payments, M-Pesa integration)*
>
> ---
>
> #### 👩‍🏫 Expert Features
>
> *(Expert dashboard, ratings, claim questions, etc.)*
>
> ---
>
> #### 🤖 AI Features
>
> *(AI chat, study guides, quizzes, bilingual support)*
>
> ---
>
> #### 🎨 UI/UX & Styling (Kenyan feel)
>
> *(Colors, typography, cultural design, mobile-first)*
>
> ---
>
> #### 🔐 Authentication & Roles
>
> *(Students, Parents, Experts, Admins; JWT auth)*
>
> ---
>
> #### 📦 Platform Features
>
> *(Landing page, chat, marketplace, dashboards, payments)*
>
> ---
>
> #### 🚀 Technical Requirements
>
> *(Backend, frontend, database, hosting)*
>
> ---
>
> #### 🛑 Important Rules
>
> *No placeholders, fake testimonials, or fake pricing. Ensure accessibility.*

### 2. Application Generation (Lovable)

* Prompt fed into **Lovable** → full MERN stack scaffold
* Backend generated using **Cursor AI**
* Debugged and refined using **DeepSeek** & **ChatGPT**
* Iterative adjustments to fully implement CBC curriculum coverage

---

## 🛠 Platform Features

* **Student Dashboard:** Ask questions, track answers, view learning progress
* **Parent Dashboard:** Manage child profiles, track subscriptions
* **Expert Dashboard:** Claim questions, answer, track earnings
* **Admin Dashboard:** Approve withdrawals, oversee all activity
* **AI Chat Interface:** Real-time curriculum-aware Q\&A
* **Expert Marketplace:** Question pool & expert selection

---

## 📈 Areas for Improvement

* Adaptive learning based on student performance
* Improved AI understanding for nuanced questions
* Progress analytics dashboards for parents & students
* Additional payment options beyond M-Pesa
* Mobile UI optimization for low-end devices

---

## 🔗 Demo / Deployment

- **Frontend (Vercel):** [https://elimu-buddy.vercel.app/](https://elimu-buddy.vercel.app/)
- **Backend API (Render):** [https://elimu-buddy.onrender.com/api](https://elimu-buddy.onrender.com/api)

---

## 📝 Setup Instructions

**Backend**

```bash
cd backend
pnpm install
cp .env.example .env
pnpm run dev
```

**Frontend**

```bash
cd frontend
pnpm install
pnpm run dev
```

Access the app at `http://localhost:5173/`.

---

## 🤝 Contribution

This is a **hackathon project**. Contributions are welcome for AI improvements, UI enhancements, or backend optimizations.

---

## 🏆 License

MIT License © 2025 Jane Muriithi

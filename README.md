# 📍 FieldForce Hub

> **Real-Time Field Force Management & GPS Agent Tracking Platform**

FieldForce Hub is a modern, enterprise-ready field workforce management platform designed to optimize operations, track agent real-time GPS locations, manage attendance, assign field tasks, and generate compliance audit reports seamlessly.

---

## ✨ Key Features

- **🗺️ Real-Time GPS Tracking & Map Interface**: Interactive map dashboards powered by **Leaflet** & **React-Leaflet** for live geolocation updates of field personnel.
- **📋 Task & Workflow Management**: Assign, track, and re-order field operations dynamically using **Dnd Kit** drag-and-drop mechanics.
- **📄 Automated PDF Report Generation**: Export detailed shift audits, agent activity summaries, and attendance logs into branded PDFs with **jsPDF** & **jsPDF-Autotable**.
- **🔲 QR Code Attendance & Verification**: Instant check-ins and field location validation powered by **QRCode** generation and scanning integration.
- **📊 Real-Time Analytics**: Operations performance metrics, task completion velocity, and team efficiency charts rendered with **Recharts**.
- **⚡ Backend Power**: Built on **Supabase** for real-time WebSockets, PostgreSQL data structures, and secure user authentication.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Mapping & Geolocation**: Leaflet 1.9, React-Leaflet
- **Backend & Database**: Supabase JS (`@supabase/supabase-js`)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **UI Components & Styling**: Tailwind CSS, Radix UI Primitives, Lucide Icons, Next Themes (Dark/Light mode support)
- **Data & Charts**: Recharts, Date-fns, Sonner Toast Notifications
- **Document Generation**: jsPDF, jsPDF-Autotable, QRCode

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm** or **bun**: Package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ZaidBuilds/fieldforce-hub.git
   cd fieldforce-hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to launch the platform.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">
  Crafted with ❤️ by <a href="https://github.com/ZaidBuilds">Mohd Zaid (ZaidBuilds)</a>
</div>

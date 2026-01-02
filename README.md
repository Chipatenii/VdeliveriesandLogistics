# V deliveries and Logistics 🏍️

**Premium Logistics Platform for the Zambian Market**

V deliveries and Logistics is a high-performance, Progressive Web App (PWA) designed to streamline delivery operations in Lusaka. Built with a focus on mobile-first accessibility, the platform connects business clients with a fleet of efficient motorbike drivers, ensuring rapid and tracked deliveries even on spotty networks.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + Shadcn/UI (Dark Mode by default)
- **Backend/Database:** Supabase (PostgreSQL)
- **Geospatial Logic:** PostGIS (Point geography for precise tracking)
- **Real-time:** Supabase Realtime (WebSockets for live driver movements)
- **Mapping:** Leaflet & OpenStreetMap (Data-efficient tiles)
- **PWA Capabilities:** Screen Wake Lock API (GPS streaming), Manifest & Offline support

---

## 🚀 Key Features

### 1. Driver Side (PWA)

- **Live Location Tracking:** High-accuracy GPS streaming using the `watchPosition` API.
- **Screen Wake Lock:** Prevents mobile devices from sleeping while "Online," ensuring the GPS stream is never interrupted.
- **KPI Dashboard:** Real-time visibility into earnings (ZMW) and delivery volume.
- **Thumb Zone Design:** Critical actions (Go Online/Offline) are placed at the bottom for easy one-handed operation.

### 2. Admin Side (Fleet Overview)

- **Command Center:** A live map showing all online drivers in Lusaka.
- **Real-time Updates:** Icons move instantly on the map as drivers move, powered by Supabase Realtime subscriptions.
- **Driver Management:** View individual driver profiles, vehicle types, and last-seen statuses.

---

## 📈 Scalability

- **Database Architecture:** Uses PostGIS for efficient spatial queries, allowing the fleet to scale to thousands of drivers without performance degradation.
- **Real-time Channels:** Leverages Supabase's scalable Realtime infrastructure to handle high-concurrency location updates.
- **Mobile Efficiency:** Optimized for low-end devices and variable network conditions typical in the Zambian market.

---

## 👨‍💻 Developer Details

**Developed by Innocent Manda**  
Senior Software Engineer & System Architect

📧 **Email:** [innocentmanda70@gmail.com](mailto:innocentmanda70@gmail.com)  
📞 **Phone:** [+260979082676](tel:+260979082676)

---

## 🚦 Getting Started

1. **Setup Env Variables:** Create a `.env.local` file (based on `.env.example`) with your Supabase credentials.
2. **Database Migration:** Run the `supabase_setup.sql` script in your Supabase SQL editor to initialize tables and enable PostGIS.
3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Run Development Server:**

   ```bash
   npm run dev
   ```

5. **Production Build:**

   ```bash
   npm run build
   ```

---
*V deliveries and Logistics - Delivery excellence for Lusaka.*

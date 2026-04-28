# ResQNet 🆘

**AI-Powered Emergency Response & Real-Time Coordination Platform**

ResQNet is a high-fidelity emergency response platform designed to bridge the gap between victims and dispatchers. Built with modern web technologies and powered by Gemini AI, it provides real-time tracking, automated triage, and multilingual assistance during critical moments.

## 🚀 Key Features

- **🚨 SOS Mode**: Instant emergency triggering with automated crash and fall detection.
- **🤖 AI First-Aid Assistant**: Context-aware survival instructions powered by Gemini AI, with full offline fallback packs.
- **🗺️ Live Dispatcher Dashboard**: Real-time map tracking of incidents and emergency vehicles using OSRM routing.
- **📊 Incident Reports**: Automatically generated medical and incident reports for hospital handover.
- **📱 Fully Responsive**: Optimized for both high-performance desktop dashboards and urgent mobile SOS interactions.
- **🌍 Multilingual Support**: AI-powered translation for first-aid instructions in multiple regional languages.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Maps**: React Leaflet, OpenStreetMap, OSRM (Open Source Routing Machine)
- **AI**: Google Gemini AI (via Gemini API)
- **Backend**: Node.js, Express, MongoDB (via Mongoose)
- **Styling**: Vanilla CSS + Tailwind utilities

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Souryanath/ResQNet.git
   cd ResQNet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Start the backend server**:
   ```bash
   node server.js
   ```

## 📱 Mobile Access

ResQNet is designed with a **Mobile-First** approach for victims. Access the app on your phone to see the SOS interface, while using the desktop view for the Dispatcher Dashboard.

---
Built with ❤️ for emergency response coordination.

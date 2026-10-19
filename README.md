# J.A.R.V.I.S. - Advanced Sci-Fi Personal AI Assistant

An advanced, production-grade personal AI assistant named **J.A.R.V.I.S.** (Just A Rather Very Intelligent System), designed primarily for Android mobile devices and modern desktop browsers with an authentic Stark Industries Iron Man holographic HUD aesthetic.

---

## 1. Environment Assessment & Architecture Strategy

### Assessment of Available Environment:
- **Environment Type:** Cloud full-stack Linux container running Node.js, Express, React 19, Vite, and TypeScript.
- **Android SDK Status:** The current container does not include local Android SDK/Gradle command-line tools to compile `.apk` binaries directly.
- **Best Supported Approach:** A **mobile-first, Android-targeted Progressive Web Application (PWA)** combined with an Express full-stack backend:
  - Responsive HUD viewport configured with `viewport-fit=cover`, mobile status-bar theming, and Android touch targets.
  - Native Android Intent dispatching via deep-link URI schemes (`whatsapp://`, `vnd.youtube://`, `geo:`, `tel:`, `sms:`, `mailto:`, and `intent:#Intent;...;end`).
  - Browser/Android Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with native recognition for English, Hindi (`hi-IN`), and Hinglish.
  - Dual TTS: Server-side Gemini 3.8 Flash Lite TTS (`gemini-3.8-flash-lite-tts`) and client-side SpeechSynthesis.
  - Procedural Web Audio API synthesizer for sci-fi HUD audio cues (zero external asset dependency).

---

## 2. Core Features

### 🌟 Futuristic User Interface
- **Iron Man HUD Aesthetic:** Deep OLED black background, electric cyan and gold holographic accents, radar sweeps, scanline overlay, and custom HUD typography (Orbitron, Rajdhani, JetBrains Mono).
- **Interactive Arc Reactor:** State-reactive canvas rendering with 10 power nodes, palladium core, and dynamic animations reacting to Idle, Listening, Processing, Speaking, and Alert states.
- **Real-Time Oscilloscope:** Real-time 32-bar audio frequency analyzer reflecting mic input and speech output.
- **5 Configurable Accent Themes:** Stark Cyan, Mark 85 Gold, Crimson Protocol, Emerald Matrix, and Quantum Violet.

### 🎙️ Advanced Multilingual Voice System
- **Push-to-Talk & Hands-Free Mode:** Tap the Arc Reactor or microphone button to toggle voice input. Hands-free mode automatically resumes listening after JARVIS speaks.
- **Multilingual Support:** Automatic detection and natural responses in **English**, **हिन्दी (Hindi)**, and **Hinglish** (e.g., *"Jarvis ek 5 minute ka timer lagao"* / *"Kal weather kaisa rahega?"*).
- **Dual TTS Engine:** Server-side Gemini 3.8 Flash Lite TTS with prebuilt voices (`Zephyr`, `Fenrir`, `Puck`, `Kore`, `Charon`) with instant browser voice fallback.
- **Speech Controls:** Interrupt speech at any time, adjust speech rate, pitch, and voice profile.

### 🧠 Intelligent AI Brain
- **Gemini 3.8 Flash:** Powered by `@google/genai` on the server backend with conversation history context and reasoning.
- **Google Search Grounding:** Real-time web retrieval with live verified sources and clickable citation links.
- **Configurable Personalities:** Classic J.A.R.V.I.S., Tactical Protocol, F.R.I.D.A.Y., and Research Core.

### 💾 Long-Term Neural Memory
- **Persistent Verified Memory:** Stored in local persistent storage, categorized into Profile, Preferences, Key Facts, and Custom Instructions.
- **Full Memory Dashboard:** View, search, add, inline-edit, delete, export to JSON, and restore from JSON backups.
- **Strict Anti-Hallucination:** JARVIS only references verified memories committed to storage. Memory can be toggled on/off at will.

### 🛠️ Assistant Tools & Android Intent Hub
- **Countdown Timers:** Live progress rings, audible alerts, and notification triggers.
- **Alarms:** Time-based 24h alarms with audio cues.
- **Reminders:** Priority-tagged reminders with completion toggles.
- **Quick Notes:** Searchable and categorized memo storage.
- **Live Weather Telemetry:** Real-time weather, temperature, humidity, wind speed, and 4-day forecast via Open-Meteo API.
- **Android Intent Launcher:** Direct deep links to WhatsApp, YouTube, Google Maps GPS, Phone dialer, Email, and Clock.
- **Safe Math Evaluator:** Evaluates expressions, square roots, trigonometry, powers, and percentages.

### 🎨 AI Image Studio (Neural Synthesizer)
- **Model:** `gemini-3.1-flash-lite-image`
- **Aspect Ratios:** 1:1 (Square), 16:9 (Wide), 9:16 (Portrait), 4:3, 3:4.
- **Stylistic Matrix:** Holographic HUD, Stark Blueprint, Cyberpunk Neon, Photorealistic 8K, Cinematic Concept, and Anime Mecha.
- **Features:** Prompt Enhancer, full-screen lightbox preview, "Save PNG to Device", and persistent repository storage.

### 🎬 AI Video Studio (Veo Motion Synthesis)
- **Model:** `veo-3.1-lite-generate-preview`
- **Supported Formats:** 720p (High Performance) & 1080p (Full HD), 16:9 Landscape & 9:16 Portrait.
- **Reference Image Frame:** Optional uploaded image utilized as starting keyframe.
- **Asynchronous Pipeline:** 3-step lifecycle: job initiation -> polling loop with countdown telemetry -> binary MP4 stream retrieval.
- **Features:** In-browser MP4 player, "Save MP4 to Device", and persistent repository storage.

### 🖼️ Media Repository Gallery
- Centralized storage for all synthesized images and motion videos.
- Filter by All, Images, or Videos with full resolution playback, prompt copy, device download, and deletion controls.

### 📱 Android Default Assistant & APK Engine
- **Platform Assessment:** Full architectural assessment of Android OS digital assistant qualification. Explains why browser sandboxes cannot register as default assistant alone and provides the solution via native AndroidManifest.xml.
- **1-Click WebAPK Installation:** Built-in `beforeinstallprompt` hook to install JARVIS directly onto any Android phone.
- **APK Bundle Download:** Direct download of `AndroidManifest.xml` (with `android.intent.action.ASSIST` intent filter), `twaconfig.json`, and Google Bubblewrap 1-command APK build instructions.

---

## 3. Installation & Android Setup

### Running as an Android WebAPK:
1. Open the app URL in Google Chrome on your Android smartphone.
2. Tap **"APK"** in the top navigation bar or the Chrome menu (**⋮**).
3. Select **"Install App"** / **"Add to Home screen"**.
4. The app launches in full-screen standalone mode with no browser address bar!

### Compiling a Production Signed Android APK:
1. Tap **"APK"** in the top header and click **"Download APK Bundle"**.
2. Run Google's official Bubblewrap CLI:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest="YOUR_APP_URL/manifest.json"
bubblewrap build
```
3. Install `app-release-signed.apk` on your phone.
4. Go to **Android Settings > Apps > Default apps > Digital assistant app** and select **J.A.R.V.I.S.**!

---

## 4. Environment & Billing Requirements
- `GEMINI_API_KEY`: Injected automatically at runtime by AI Studio.
- Image generation uses `gemini-3.1-flash-lite-image`.
- Video generation uses `veo-3.1-lite-generate-preview`. Veo models require an active Google Cloud project with billing enabled for Vertex AI / Gemini API.
- All core voice, memory, chat, weather, reminders, alarms, timers, and intent tools work with standard API keys.

# TouristTech 🌍📸

> Visual translator, accessibility reader & personal gastro assistant — Built for Hackathon

[![GCP](https://img.shields.io/badge/Google%20Cloud-Vertex%20AI%20·%20Vision%20·%20TTS-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vuedotjs)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite)](https://vitejs.dev)

---

## 🏗️ Project Structure

```
SM_TouristTech_Hackaton/
├── database/
│   └── schema.sql              # Cloud SQL (PostgreSQL) schema
├── cloud-function/
│   ├── index.js                # Main Cloud Function (Storage trigger)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── assets/main.css
│   │   ├── components/
│   │   │   ├── Profile.vue       ← User profile editor
│   │   │   ├── CameraUpload.vue  ← Camera + upload to Storage
│   │   │   └── ResultView.vue    ← Result display + audio player
│   │   ├── views/
│   │   ├── stores/userStore.js
│   │   ├── router/index.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    └── IAM_ROLES.md            # Cloud IAM roles & gcloud commands
```

---

## 🚀 Application Flow

```
User ──► Profile.vue ──► Save preferences ──► Cloud SQL
                                                    │
User ──► CameraUpload.vue ──► Photo ──► Cloud Storage (trigger!)
                                                    │
                                    Cloud Function (Node.js)
                                         │
                                    Cloud Vision API (OCR)
                                         │
                                    Vertex AI Gemini (filter)
                                         │
                                    Cloud Translation API
                                         │
                                    Cloud Text-to-Speech
                                         │
                                    MP3 ──► Cloud Storage
                                         │
User ◄── ResultView.vue ◄── Translated text + Audio URL
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js ≥ 20
- Google Cloud SDK (`gcloud`)
- A GCP project with the required APIs enabled (see `docs/IAM_ROLES.md`)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL
npm run dev
# → http://localhost:5173
```

### Cloud Function (local emulation)

```bash
cd cloud-function
npm install
cp .env.example .env          # fill in your values
npx @google-cloud/functions-framework --target=processMenuImage
```

### Database

```bash
# Apply schema to your Cloud SQL instance
psql -h <HOST> -U touristtech_user -d touristtech -f database/schema.sql
```

---

## ☁️ GCP Deployment

See [`docs/IAM_ROLES.md`](docs/IAM_ROLES.md) for the full deployment commands including:
- Service Account creation
- IAM role bindings
- API enablement
- Cloud Function deployment with Cloud SQL connection
- Cloud Storage CORS configuration

---

## 🔑 Environment Variables (Cloud Function)

| Variable         | Description                              |
|------------------|------------------------------------------|
| `GCP_PROJECT_ID` | Your GCP project ID                      |
| `GCP_LOCATION`   | Region (e.g. `us-central1`)             |
| `GCP_AUDIO_BUCKET`| Bucket where MP3 audio is stored        |
| `DB_HOST`        | Cloud SQL socket path or IP              |
| `DB_NAME`        | PostgreSQL database name                 |
| `DB_USER`        | PostgreSQL user                          |
| `DB_PASSWORD`    | PostgreSQL password (use Secret Manager) |

---

## 📋 GCP APIs Required

- Cloud Storage API
- Cloud Vision API
- Vertex AI API (Gemini)
- Cloud Translation API (v3)
- Cloud Text-to-Speech API
- Cloud SQL Admin API
- Cloud Functions API (2nd gen)
- Eventarc API
- Cloud Run API

---

*Built with ❤️ for Hackathon – Sistemes Multimedia*
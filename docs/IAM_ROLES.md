# TouristTech – Cloud IAM Roles & Permissions

## Service Account: `touristtech-function-sa`

This is the identity assigned to the Cloud Function.
Create it with:
```bash
gcloud iam service-accounts create touristtech-function-sa \
  --display-name="TouristTech Cloud Function SA" \
  --project=touristtech-prod
```

---

## Required IAM Role Bindings

Grant each role at the **project level** unless a more restrictive scope is noted.

| # | Role (ID)                                        | Display Name                        | Why it's needed |
|---|--------------------------------------------------|-------------------------------------|-----------------|
| 1 | `roles/storage.objectAdmin`                       | Storage Object Admin                | Read input images from the trigger bucket AND write MP3 audio to the audio bucket. |
| 2 | `roles/storage.objectViewer`                      | Storage Object Viewer               | (Optional – replace #1 with ObjectAdmin + ObjectViewer per bucket for least-privilege) |
| 3 | `roles/cloudsql.client`                           | Cloud SQL Client                    | Connect to the Cloud SQL (PostgreSQL) instance via the Cloud SQL Auth Proxy. |
| 4 | `roles/cloudvision.user` **(or)**                 | Cloud Vision API User               | Call the Vision API for OCR text detection on the uploaded image. |
|   | `roles/serviceusage.serviceUsageConsumer`         | Service Usage Consumer              | (Needed together with Vision User) |
| 5 | `roles/aiplatform.user`                           | Vertex AI User                      | Call Gemini via the Vertex AI API (`generateContent`). |
| 6 | `roles/cloudtranslate.user`                       | Cloud Translation API User          | Translate the Gemini output to the user's native language. |
| 7 | `roles/cloudtexttospeech.user`                    | Cloud Text-to-Speech User           | Synthesize the translated text into MP3 audio. |
| 8 | `roles/logging.logWriter`                         | Logs Writer                         | Write structured logs to Cloud Logging (automatic for Cloud Functions, but explicit is safer). |
| 9 | `roles/monitoring.metricWriter`                   | Monitoring Metric Writer            | Emit metrics for Cloud Monitoring dashboards. |

---

## gcloud Commands to Apply All Bindings

```bash
PROJECT=touristtech-prod
SA=touristtech-function-sa@${PROJECT}.iam.gserviceaccount.com

# Cloud Storage – full control over objects (both buckets)
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/storage.objectAdmin"

# Cloud SQL – connect via Cloud SQL Auth Proxy
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/cloudsql.client"

# Cloud Vision API
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/cloudvision.user"

# Vertex AI (Gemini)
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/aiplatform.user"

# Cloud Translation API
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/cloudtranslate.user"

# Cloud Text-to-Speech
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/cloudtexttospeech.user"

# Logging & Monitoring
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/monitoring.metricWriter"
```

---

## APIs to Enable on the Project

```bash
gcloud services enable \
  vision.googleapis.com \
  translate.googleapis.com \
  texttospeech.googleapis.com \
  aiplatform.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  run.googleapis.com \
  --project=$PROJECT
```

---

## Cloud Storage Bucket CORS (for direct browser upload via signed URLs)

Apply this to the **upload bucket** so the Vue.js frontend can PUT images directly:

```json
[
  {
    "origin": ["https://your-frontend-domain.web.app", "http://localhost:5173"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
gcloud storage buckets update gs://touristtech-uploads-prod \
  --cors-file=cors.json
```

---

## Cloud Function Deployment Command

```bash
gcloud functions deploy processMenuImage \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./cloud-function \
  --entry-point=processMenuImage \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=touristtech-uploads-prod" \
  --service-account=$SA \
  --set-env-vars="GCP_PROJECT_ID=touristtech-prod,GCP_LOCATION=us-central1,GCP_AUDIO_BUCKET=touristtech-audio-prod,DB_HOST=/cloudsql/touristtech-prod:us-central1:touristtech-db,DB_NAME=touristtech,DB_USER=touristtech_user" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --add-cloudsql-instances=touristtech-prod:us-central1:touristtech-db \
  --memory=512Mi \
  --timeout=300s \
  --min-instances=0 \
  --max-instances=10 \
  --project=$PROJECT
```

> **Note:** Store `DB_PASSWORD` in **Secret Manager** (not as a plain env var) and grant the SA the `roles/secretmanager.secretAccessor` role.

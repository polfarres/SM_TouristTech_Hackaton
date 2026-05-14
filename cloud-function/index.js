'use strict';

/**
 * TouristTech - Cloud Function: processMenuImage
 * ------------------------------------------------
 * Trigger : Cloud Storage → finalize event (new image uploaded)
 * Flow    :
 *   1. Extract metadata (userId) from object metadata
 *   2. Fetch user profile (language + restrictions) from Cloud SQL
 *   3. Cloud Vision API  → OCR raw text
 *   4. Vertex AI (Gemini) → filter dishes, flag allergens, recommend safe options
 *   5. Cloud Translation → translate to user's native language
 *   6. Cloud TTS         → generate MP3 audio
 *   7. Upload MP3 to Cloud Storage & build public URL
 *   8. Persist result to Cloud SQL (analysis_history)
 */

require('dotenv').config();

const { Storage }           = require('@google-cloud/storage');
const vision                = require('@google-cloud/vision');
const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const textToSpeech          = require('@google-cloud/text-to-speech');
const { VertexAI }          = require('@google-cloud/vertexai');
const { Pool }              = require('pg');
const functions             = require('@google-cloud/functions-framework');

// ─────────────────────────────────────────────
// Environment variables (set in Cloud Function config or .env for local)
// ─────────────────────────────────────────────
const {
  GCP_PROJECT_ID,           // e.g. 'touristtech-prod'
  GCP_LOCATION,             // e.g. 'us-central1'
  GCP_AUDIO_BUCKET,         // bucket where MP3s are stored, e.g. 'touristtech-audio'
  DB_HOST,                  // Cloud SQL public IP or '/cloudsql/<instance-connection-name>'
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
} = process.env;

// ─────────────────────────────────────────────
// GCP Clients (instantiated once per cold start)
// ─────────────────────────────────────────────
const storageClient   = new Storage({ projectId: GCP_PROJECT_ID });
const visionClient    = new vision.ImageAnnotatorClient();
const translateClient = new TranslationServiceClient();
const ttsClient       = new textToSpeech.TextToSpeechClient();
const vertexAI        = new VertexAI({ project: GCP_PROJECT_ID, location: GCP_LOCATION });
const geminiModel     = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─────────────────────────────────────────────
// Cloud SQL connection pool (shared across invocations)
// ─────────────────────────────────────────────
const pool = new Pool({
  host:     DB_HOST,
  port:     parseInt(DB_PORT, 10),
  database: DB_NAME,
  user:     DB_USER,
  password: DB_PASSWORD,
  max:      5,
  ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLOUD FUNCTION (Cloud Storage trigger)
// ─────────────────────────────────────────────────────────────────────────────
functions.cloudEvent('processMenuImage', async (cloudEvent) => {
  const data   = cloudEvent.data;
  const bucket = data.bucket;
  const name   = data.name;         // e.g. uploads/<userId>/<timestamp>.jpg

  console.log(`[TouristTech] New image detected: gs://${bucket}/${name}`);

  // ── Extract userId from file path convention: uploads/<userId>/filename ──
  const pathParts = name.split('/');
  if (pathParts.length < 2) {
    console.error('[TouristTech] Unexpected file path format, cannot resolve userId.');
    return;
  }
  const userId = pathParts[1];

  // ── Create a placeholder row in analysis_history ──
  const historyRow = await createHistoryRow(userId, `gs://${bucket}/${name}`);
  const historyId  = historyRow.id;

  try {
    // ── STEP 1: Fetch user profile from Cloud SQL ──────────────────────────
    console.log(`[TouristTech] Fetching profile for userId: ${userId}`);
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error(`No user_preferences found for userId: ${userId}`);
    }
    const { native_language, dietary_restrictions, allergies, extra_notes } = profile;

    // ── STEP 2: Cloud Vision OCR ───────────────────────────────────────────
    console.log('[TouristTech] Running Cloud Vision OCR...');
    const imageUri  = `gs://${bucket}/${name}`;
    const ocrText   = await extractTextWithVision(imageUri);
    console.log(`[TouristTech] OCR raw text (first 200 chars): ${ocrText.slice(0, 200)}`);

    await updateHistoryStatus(historyId, 'processing', { ocr_raw_text: ocrText });

    // ── STEP 3: Vertex AI (Gemini) – filter & recommend ───────────────────
    console.log('[TouristTech] Sending to Vertex AI Gemini...');
    const geminiText = await filterWithGemini(ocrText, dietary_restrictions, allergies, extra_notes);
    console.log(`[TouristTech] Gemini result (first 200 chars): ${geminiText.slice(0, 200)}`);

    await updateHistoryStatus(historyId, 'processing', { gemini_result: geminiText });

    // ── STEP 4: Cloud Translation API ─────────────────────────────────────
    console.log(`[TouristTech] Translating to: ${native_language}`);
    const translatedText = await translateText(geminiText, native_language);

    await updateHistoryStatus(historyId, 'processing', { translated_text: translatedText });

    // ── STEP 5: Cloud Text-to-Speech – generate MP3 ───────────────────────
    console.log('[TouristTech] Generating TTS audio...');
    const audioContent = await synthesizeSpeech(translatedText, native_language);

    // ── STEP 6: Upload MP3 to Cloud Storage ───────────────────────────────
    const audioFileName   = `audio/${userId}/${historyId}.mp3`;
    const audioPublicUrl  = await uploadAudio(audioContent, GCP_AUDIO_BUCKET, audioFileName);
    const audioGcsUrl     = `gs://${GCP_AUDIO_BUCKET}/${audioFileName}`;
    console.log(`[TouristTech] Audio uploaded: ${audioPublicUrl}`);

    // ── STEP 7: Mark analysis as done in Cloud SQL ────────────────────────
    await updateHistoryStatus(historyId, 'done', {
      translated_text:  translatedText,
      audio_gcs_url:    audioGcsUrl,
      audio_public_url: audioPublicUrl,
      source_language:  'auto',
      target_language:  native_language,
    });

    console.log(`[TouristTech] ✅ Processing complete for historyId: ${historyId}`);

  } catch (err) {
    console.error('[TouristTech] ❌ Error during processing:', err);
    await updateHistoryStatus(historyId, 'error', { error_message: err.message }).catch(() => {});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Fetch user profile from Cloud SQL
// ─────────────────────────────────────────────────────────────────────────────
async function getUserProfile(userId) {
  const query = `
    SELECT p.native_language, p.dietary_restrictions, p.allergies, p.extra_notes
    FROM   user_preferences p
    WHERE  p.user_id = $1
    LIMIT  1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Insert a new analysis_history row (status = pending)
// ─────────────────────────────────────────────────────────────────────────────
async function createHistoryRow(userId, imageGcsUrl) {
  const query = `
    INSERT INTO analysis_history (user_id, image_gcs_url, status)
    VALUES ($1, $2, 'pending')
    RETURNING id
  `;
  const result = await pool.query(query, [userId, imageGcsUrl]);
  return result.rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Update analysis_history row with partial data
// ─────────────────────────────────────────────────────────────────────────────
async function updateHistoryStatus(historyId, status, fields = {}) {
  const setClauses = ['status = $2'];
  const values     = [historyId, status];
  let   idx        = 3;

  for (const [col, val] of Object.entries(fields)) {
    setClauses.push(`${col} = $${idx}`);
    values.push(val);
    idx++;
  }

  const query = `
    UPDATE analysis_history
    SET    ${setClauses.join(', ')}, updated_at = NOW()
    WHERE  id = $1
  `;
  await pool.query(query, values);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cloud Vision – extract text via OCR
// ─────────────────────────────────────────────────────────────────────────────
async function extractTextWithVision(gcsUri) {
  const [result] = await visionClient.textDetection({ image: { source: { imageUri: gcsUri } } });
  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    return '';
  }
  // The first annotation contains the full concatenated text
  return detections[0].description || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Vertex AI (Gemini) – filter dishes & recommend safe options
// ─────────────────────────────────────────────────────────────────────────────
async function filterWithGemini(menuText, dietaryRestrictions = [], allergies = [], extraNotes = '') {
  const restrictionsList = [...(dietaryRestrictions || []), ...(allergies || [])].join(', ') || 'cap';
  const extraInfo        = extraNotes ? `Informació addicional: ${extraNotes}.` : '';

  const prompt = `
Ets un assistent gastronòmic expert en seguretat alimentària.

Se't proporciona el text d'un menú o cartell d'un restaurant extret per OCR. La teva tasca és:
1. Llegir i interpretar el text del menú, malgrat possibles errors d'OCR.
2. Identificar tots els plats o ítems disponibles.
3. Descartar qualsevol plat que contingui els al·lèrgens o restrictions de l'usuari: ${restrictionsList}.
4. Recomanar els plats que siguin segurs per a l'usuari.
5. Per a cada plat recomanat, explica breument per què és segur.
6. Si no hi ha plats segurs, indica-ho clarament i amb empatia.
${extraInfo}

Respon sempre en anglès neutre (serà traduït posteriorment).
Respon en format clar, llista de plats recomanats amb una breu explicació de cada un.

--- TEXT DEL MENÚ ---
${menuText}
--- FI DEL MENÚ ---
  `.trim();

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.3,
    },
  };

  const result   = await geminiModel.generateContent(request);
  const response = result.response;
  const text     = response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cloud Translation API v3 – translate text
// ─────────────────────────────────────────────────────────────────────────────
async function translateText(text, targetLanguage) {
  const parent = `projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}`;

  const [response] = await translateClient.translateText({
    parent,
    contents:           [text],
    mimeType:           'text/plain',
    targetLanguageCode: targetLanguage,
  });

  return response.translations?.[0]?.translatedText || text;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cloud Text-to-Speech – synthesize audio
// ─────────────────────────────────────────────────────────────────────────────
async function synthesizeSpeech(text, languageCode) {
  const [response] = await ttsClient.synthesizeSpeech({
    input:       { text },
    voice:       { languageCode, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  return response.audioContent; // Buffer
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Upload Buffer to Cloud Storage and make it public
// ─────────────────────────────────────────────────────────────────────────────
async function uploadAudio(audioBuffer, bucketName, destFileName) {
  const bucket = storageClient.bucket(bucketName);
  const file   = bucket.file(destFileName);

  await file.save(audioBuffer, {
    metadata: { contentType: 'audio/mpeg' },
    resumable: false,
  });

  // Make the file publicly readable so the frontend can stream it directly
  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${destFileName}`;
}

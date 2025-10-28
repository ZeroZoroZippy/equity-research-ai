# Firebase Authentication & Firestore Setup Guide

Follow these steps to connect the Equity Research AI app to Firebase for Google authentication, Firestore history storage, and analytics.

## 1. Create a Firebase project

1. Visit [https://console.firebase.google.com](https://console.firebase.google.com) and create a new project (or select an existing one).
2. Disable Google Analytics during project creation if you prefer, though the web app can send analytics events if Measurement ID is available.

## 2. Enable Firestore

1. In the Firebase console, open **Build → Firestore Database**.
2. Click **Create Database** and start in **Production mode**.
3. Choose the region closest to your users and finish the wizard.

## 3. Enable Google sign-in

1. Navigate to **Build → Authentication → Sign-in method**.
2. Enable **Google** and provide your project support email if prompted.

## 4. Register the web app & grab config

1. In the Firebase console, click the gear icon → **Project settings** → **General**.
2. Under **Your apps**, add a new **Web** app (</>) if one doesn’t exist.
3. Copy the config snippet; you’ll need the following keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`
   - `measurementId` (optional but recommended for analytics)

Create a `.env` file inside `frontend/` (or update your existing one) with:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX   # optional
```

> ⚠️ These values are **public** web keys and safe to keep in client env files. Do **not** embed service-account JSON in the frontend.

## 5. Create a service account for the backend

1. Go to **Project settings → Service accounts**.
2. Click **Generate new private key** for the default service account.
3. Save the downloaded JSON file securely (e.g., `firebase-service-account.json`).

Set an environment variable so the Flask backend can locate the credentials:

```bash
export FIREBASE_CREDENTIALS=/absolute/path/to/firebase-service-account.json
```

On macOS/Linux you can add that line to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.). On Windows, add a system/user environment variable.

## 6. Install dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## 7. Run the stack with auth enabled

```bash
# Terminal 1 – backend (from project root)
python app.py

# Terminal 2 – frontend
cd frontend
npm run dev
```

When you visit the app you should be redirected to the new login screen. Sign in with Google, then start research; Firestore will record history under `users/{uid}/research_history`.

## 8. Verify Firestore writes

In the Firebase console, open **Firestore Database** and confirm documents appear under:

```
users/{uid}/research_history/{session_id}
```

Each document should contain metadata (`type`, `symbol`, `status`, timestamps) and, upon completion, the structured report payload.

## 9. Optional analytics

If you provided a `measurementId`, Firebase Analytics will collect the events emitted in the UI (`login_success`, `research_session_started`, `report_tab_selected`, etc.). Review them under **Analytics → Events** in the console.

## 10. Common issues

- **Missing Firebase config:** the frontend will throw an error if required `VITE_FIREBASE_*` variables are absent.
- **Service account path wrong:** the backend returns `500` with “Firebase is not configured”. Double-check `FIREBASE_CREDENTIALS`.
- **Unauthorized SSE connection:** ensure the frontend injects a fresh ID token; signing out/in again refreshes it.

Once configured, all API calls, SSE streams, and history retrieval require a valid user session, fulfilling the authentication requirement.

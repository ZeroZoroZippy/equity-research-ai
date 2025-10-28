import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missing = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missing.length) {
  throw new Error(
    `Missing Firebase configuration values: ${missing.join(', ')}. ` +
    'Create a Firebase project and define the VITE_FIREBASE_* environment variables. '
    + 'See docs/FIREBASE_SETUP.md for guidance.'
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analyticsInstance = null;
if (typeof window !== 'undefined') {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase analytics initialisation skipped:', error?.message || error);
  }
}

export const firebaseApp = app;
export const firebaseAuth = auth;
export const googleAuthProvider = googleProvider;

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const trackEvent = (eventName, params = {}) => {
  if (!analyticsInstance) {
    return;
  }
  try {
    logEvent(analyticsInstance, eventName, params);
  } catch (error) {
    console.warn('Failed to log analytics event', eventName, error);
  }
};

export const getIdToken = async () => {
  if (!auth.currentUser) {
    return null;
  }
  return auth.currentUser.getIdToken();
};

import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// const serviceAccount = {
//   type: "service_account",
//   project_id: "rewardnft-e01fc",
//   private_key_id: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//   client_email: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID,
//   auth_uri: "https://accounts.google.com/o/oauth2/auth",
//   token_uri: "https://oauth2.googleapis.com/token",
//   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//   client_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_CERT_URL,
//   universe_domain: "googleapis.com",
// }

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Initialize Firebase Admin
const adminApp =
  getApps().find((app) => app.name === "admin") ||
  initializeApp(
    {
      credential: cert(serviceAccount as admin.ServiceAccount),
      projectId: "rewardnftapp",
    },
    "admin",
  )

// Initialize Admin Firestore
export const adminDb = getFirestore(adminApp)

// Initialize Admin Auth
export const adminAuth = getAuth(adminApp)

export default adminApp

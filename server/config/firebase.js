const admin = require('firebase-admin');

let serviceAccount;

// Check if Firebase credentials are provided via environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', error);
    process.exit(1);
  }
} else {
  // Fallback to local file for development
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { admin, db, auth, bucket };

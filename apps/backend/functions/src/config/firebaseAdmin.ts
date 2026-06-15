import * as admin from 'firebase-admin';

// Initialize firebase admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Configure Firestore settings
db.settings({
  ignoreUndefinedProperties: true
});

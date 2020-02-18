import * as admin from "firebase-admin";

export default admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID
});

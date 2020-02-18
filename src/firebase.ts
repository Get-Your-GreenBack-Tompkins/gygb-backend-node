import * as admin from "firebase-admin";

let cert = null;

if (process.env.FIREBASE_CREDENTIALS) {
  const keyfile = JSON.parse(process.env.FIREBASE_CREDENTIALS);

  cert = admin.credential.cert(keyfile);
}

const app = admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credential: cert
});

export default app;

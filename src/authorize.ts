import { AuthDB } from "./middleware/auth/db";

async function authorizeAsync(email: string) {
  const authdb = new AuthDB();

  await authdb.addAdmin(email);
}

export default function authorize(email: string) {
  console.log(`Authorizing for ${process.env.FIREBASE_PROJECT_ID}`);
  authorizeAsync(email)
    .then(() => {
      console.log(`Authorized: ${email}`);
    })
    .catch(err => {
      console.log(err);
    });
}

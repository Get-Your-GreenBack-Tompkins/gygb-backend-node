import { AuthDB } from "./middleware/auth/db";

async function authorizeAsync(email: string) {
  const authdb = new AuthDB();

  await authdb.addAdmin(email);
}

export default function authorize(email: string) {
  authorizeAsync(email)
    .then(() => {
      console.log(`Authorized: ${email}`);
    })
    .catch(err => {
      console.log(err);
    });
}

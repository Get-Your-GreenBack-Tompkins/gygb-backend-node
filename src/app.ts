import "./env";

import { GreenBackDB } from "./db";

import serve from "./server";

const db = new GreenBackDB();

serve(db);

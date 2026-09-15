import { config } from "dotenv";

// Match Next.js precedence for local development without committing secrets.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

// server/utils/db.ts
import { neon } from '@neondatabase/serverless';

export function sql() {
  const { NEON_DATABASE_URL } = useRuntimeConfig();
  return neon(NEON_DATABASE_URL);
}

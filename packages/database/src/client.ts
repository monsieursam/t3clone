import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from './schema';

export const db = drizzle(process.env.POSTGRES_URL!, { schema: schema });

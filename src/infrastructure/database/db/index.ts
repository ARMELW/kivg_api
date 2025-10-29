import { env } from 'node:process'
import dotenv from 'dotenv'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema'

dotenv.config()
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const logQuery = env.NODE_ENV === 'development'
export const client = postgres(env.DATABASE_URL, {
  ...(logQuery && {
    debug: (conn, query, params) => {
      //console.error('SQL Query:', query)
      if (params && params.length > 0) {
        //console.error('Params:', params)
      }
    }
  })
})
export const db = drizzle(client, { schema })

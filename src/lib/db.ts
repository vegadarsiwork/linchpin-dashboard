import { Pool, type PoolConfig, type QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __linchpinPool: Pool | undefined
}

function getConnectionString(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) {
    throw new Error('DATABASE_URL or POSTGRES_URL is not configured')
  }
  return url
}

export function getPool(): Pool {
  if (!globalThis.__linchpinPool) {
    const connectionString = getConnectionString()
    const config: PoolConfig = {
      connectionString,
      max: 10,
    }

    if (
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require')
    ) {
      config.ssl = { rejectUnauthorized: false }
    }

    globalThis.__linchpinPool = new Pool(config)
  }
  return globalThis.__linchpinPool
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, values)
  return result.rows
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, values)
  return rows[0] ?? null
}

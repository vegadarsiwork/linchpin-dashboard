import { query, queryOne } from '@/lib/db'
import { hashToken, randomToken } from './crypto'

const RESET_TTL_MINUTES = 60

export async function createPasswordResetToken(
  email: string
): Promise<string | null> {
  const user = await queryOne<{ id: string }>(
    'select id from users where lower(email) = lower($1)',
    [email.trim()]
  )
  if (!user) return null

  const token = randomToken()
  await query(
    `insert into password_reset_tokens (user_id, token_hash, expires_at)
     values ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [user.id, hashToken(token), RESET_TTL_MINUTES]
  )
  return token
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const row = await queryOne<{ id: string; user_id: string }>(
    `select id, user_id
       from password_reset_tokens
      where token_hash = $1
        and used_at is null
        and expires_at > now()`,
    [hashToken(token)]
  )
  if (!row) return null

  await query('update password_reset_tokens set used_at = now() where id = $1', [
    row.id,
  ])
  return row.user_id
}

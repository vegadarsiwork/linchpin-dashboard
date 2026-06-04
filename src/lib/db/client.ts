import { randomUUID } from 'crypto'
import { query, queryOne } from '@/lib/db'

type QueryError = { message: string }
type QueryResponse<T = any> = {
  data: T | null
  error: QueryError | null
  count?: number | null
}

type SelectOptions = {
  count?: 'exact'
  head?: boolean
}

type OrderOptions = {
  ascending?: boolean
  nullsFirst?: boolean
}

type FilterOp = '=' | '<>' | '>=' | '<=' | 'in'

type Filter = {
  column: string
  op: FilterOp
  value: unknown
}

type Operation = 'select' | 'insert' | 'update' | 'delete' | 'upsert'

function quoteIdent(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

function normalizeSelect(select?: string): string[] | null {
  if (!select || select.trim() === '*' || select.trim() === '') return null

  const columns: string[] = []
  let depth = 0
  let current = ''

  for (const char of select) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      const token = current.trim()
      if (token && !token.includes('(')) columns.push(token)
      current = ''
      continue
    }
    current += char
  }

  const last = current.trim()
  if (last && !last.includes('(')) columns.push(last)
  return columns.length ? columns : null
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  return value
}

function valuesForInsert(rows: Record<string, unknown>[]) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const values: unknown[] = []
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(serializeValue(row[column] ?? null))
      return `$${values.length}`
    })
    return `(${placeholders.join(', ')})`
  })
  return { columns, values, tuples }
}

class PgQueryBuilder<T = any> implements PromiseLike<QueryResponse<T>> {
  private operation: Operation = 'select'
  private selectColumns: string | undefined = '*'
  private selectOptions: SelectOptions = {}
  private filters: Filter[] = []
  private orders: Array<{ column: string; options: OrderOptions }> = []
  private limitCount: number | null = null
  private rangeBounds: { from: number; to: number } | null = null
  private mutationPayload: Record<string, unknown> | Record<string, unknown>[] | null = null
  private returnRows = false
  private singleMode: 'single' | 'maybeSingle' | null = null
  private upsertConflict: string[] = []

  constructor(private readonly table: string) {}

  select(columns = '*', options: SelectOptions = {}) {
    this.operation = this.operation === 'select' ? 'select' : this.operation
    this.selectColumns = columns
    this.selectOptions = options
    this.returnRows = this.operation !== 'select'
    return this
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = 'insert'
    this.mutationPayload = payload
    return this
  }

  update(payload: Record<string, unknown>) {
    this.operation = 'update'
    this.mutationPayload = payload
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  upsert(
    payload: Record<string, unknown> | Record<string, unknown>[],
    options: { onConflict?: string; count?: 'exact' } = {}
  ) {
    this.operation = 'upsert'
    this.mutationPayload = payload
    this.selectOptions.count = options.count
    this.upsertConflict = options.onConflict
      ? options.onConflict.split(',').map((part) => part.trim())
      : []
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: '=', value })
    return this
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: '<>', value })
    return this
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, op: '>=', value })
    return this
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, op: '<=', value })
    return this
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, op: 'in', value })
    return this
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === 'in') {
      const parsed =
        typeof value === 'string'
          ? value
              .replace(/^\(/, '')
              .replace(/\)$/, '')
              .split(',')
              .map((item) => item.trim().replace(/^"|"$/g, ''))
          : Array.isArray(value)
            ? value
            : []
      this.filters.push({ column, op: '<>', value: parsed })
      return this
    }

    this.filters.push({ column, op: '<>', value })
    return this
  }

  order(column: string, options: OrderOptions = {}) {
    this.orders.push({ column, options })
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  range(from: number, to: number) {
    this.rangeBounds = { from, to }
    return this
  }

  single<U = T>() {
    this.singleMode = 'single'
    return this as unknown as PgQueryBuilder<U>
  }

  maybeSingle<U = T>() {
    this.singleMode = 'maybeSingle'
    return this as unknown as PgQueryBuilder<U>
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private buildWhere(values: unknown[]): string {
    if (this.filters.length === 0) return ''

    const clauses = this.filters.map((filter) => {
      if (filter.op === 'in') {
        const list = Array.isArray(filter.value) ? filter.value : []
        if (list.length === 0) return 'false'
        const placeholders = list.map((value) => {
          values.push(serializeValue(value))
          return `$${values.length}`
        })
        return `${quoteIdent(filter.column)} in (${placeholders.join(', ')})`
      }

      if (filter.op === '<>' && Array.isArray(filter.value)) {
        if (filter.value.length === 0) return 'true'
        const placeholders = filter.value.map((value) => {
          values.push(serializeValue(value))
          return `$${values.length}`
        })
        return `${quoteIdent(filter.column)} not in (${placeholders.join(', ')})`
      }

      values.push(serializeValue(filter.value))
      return `${quoteIdent(filter.column)} ${filter.op} $${values.length}`
    })

    return ` where ${clauses.join(' and ')}`
  }

  private buildOrder(): string {
    if (this.orders.length === 0) return ''

    const clauses = this.orders.map(({ column, options }) => {
      const direction = options.ascending === false ? 'desc' : 'asc'
      const nulls =
        options.nullsFirst === undefined
          ? ''
          : options.nullsFirst
            ? ' nulls first'
            : ' nulls last'
      return `${quoteIdent(column)} ${direction}${nulls}`
    })
    return ` order by ${clauses.join(', ')}`
  }

  private buildPagination(): string {
    if (this.rangeBounds) {
      const limit = this.rangeBounds.to - this.rangeBounds.from + 1
      return ` limit ${limit} offset ${this.rangeBounds.from}`
    }
    if (this.limitCount !== null) return ` limit ${this.limitCount}`
    return ''
  }

  private selectList(): string {
    const columns = normalizeSelect(this.selectColumns)
    if (!columns) return '*'
    return columns.map(quoteIdent).join(', ')
  }

  private async execute(): Promise<QueryResponse<T>> {
    try {
      if (this.operation === 'select') return await this.executeSelect()
      if (this.operation === 'insert') return await this.executeInsert()
      if (this.operation === 'update') return await this.executeUpdate()
      if (this.operation === 'delete') return await this.executeDelete()
      return await this.executeUpsert()
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Database error',
        },
      }
    }
  }

  private async executeSelect(): Promise<QueryResponse<T>> {
    const values: unknown[] = []
    const where = this.buildWhere(values)

    const count =
      this.selectOptions.count === 'exact'
        ? Number(
            (
              await queryOne<{ count: string }>(
                `select count(*)::text as count from ${quoteIdent(this.table)}${where}`,
                values
              )
            )?.count ?? 0
          )
        : null

    if (this.selectOptions.head) {
      return { data: null, error: null, count }
    }

    const sql = `select ${this.selectList()} from ${quoteIdent(this.table)}${where}${this.buildOrder()}${this.buildPagination()}`
    const rows = await query<Record<string, unknown>>(sql, values)
    const data = await this.shapeResult(rows)
    return { data: data as T, error: null, count }
  }

  private async executeInsert(): Promise<QueryResponse<T>> {
    const rows = Array.isArray(this.mutationPayload)
      ? this.mutationPayload
      : [this.mutationPayload]
    const cleanRows = rows.filter(Boolean) as Record<string, unknown>[]
    if (cleanRows.length === 0) return { data: null, error: null }

    const { columns, values, tuples } = valuesForInsert(cleanRows)
    const returning = this.returnRows ? ` returning ${this.selectList()}` : ''
    const sql = `insert into ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) values ${tuples.join(', ')}${returning}`
    const result = await query<Record<string, unknown>>(sql, values)
    const data = this.returnRows ? await this.shapeResult(result) : null
    return { data: data as T, error: null }
  }

  private async executeUpdate(): Promise<QueryResponse<T>> {
    const payload = (this.mutationPayload ?? {}) as Record<string, unknown>
    const values: unknown[] = []
    const sets = Object.entries(payload).map(([column, value]) => {
      values.push(serializeValue(value))
      return `${quoteIdent(column)} = $${values.length}`
    })
    if (sets.length === 0) return { data: null, error: null }

    const where = this.buildWhere(values)
    const returning = this.returnRows ? ` returning ${this.selectList()}` : ''
    const sql = `update ${quoteIdent(this.table)} set ${sets.join(', ')}${where}${returning}`
    const result = await query<Record<string, unknown>>(sql, values)
    const data = this.returnRows ? await this.shapeResult(result) : null
    return { data: data as T, error: null }
  }

  private async executeDelete(): Promise<QueryResponse<T>> {
    const values: unknown[] = []
    const where = this.buildWhere(values)
    await query(`delete from ${quoteIdent(this.table)}${where}`, values)
    return { data: null, error: null }
  }

  private async executeUpsert(): Promise<QueryResponse<T>> {
    const rows = Array.isArray(this.mutationPayload)
      ? this.mutationPayload
      : [this.mutationPayload]
    const cleanRows = rows.filter(Boolean) as Record<string, unknown>[]
    if (cleanRows.length === 0) return { data: null, error: null, count: 0 }

    const { columns, values, tuples } = valuesForInsert(cleanRows)
    const conflict = this.upsertConflict.length
      ? `(${this.upsertConflict.map(quoteIdent).join(', ')})`
      : `(${quoteIdent('id')})`
    const updates = columns
      .filter((column) => !this.upsertConflict.includes(column))
      .map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`)

    const sql = `insert into ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) values ${tuples.join(', ')} on conflict ${conflict} do update set ${updates.join(', ')}`
    await query(sql, values)
    return { data: null, error: null, count: cleanRows.length }
  }

  private async shapeResult(rows: Record<string, unknown>[]): Promise<unknown> {
    const enriched = await enrichRows(this.table, rows, this.selectColumns)

    if (this.singleMode === 'single') {
      if (enriched.length !== 1) throw new Error('Expected exactly one row')
      return enriched[0]
    }

    if (this.singleMode === 'maybeSingle') {
      if (enriched.length > 1) throw new Error('Expected at most one row')
      return enriched[0] ?? null
    }

    return enriched
  }
}

async function enrichRows(
  table: string,
  rows: Record<string, unknown>[],
  select?: string
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0 || !select?.includes('(')) return rows

  if (select.includes('organisations(name)')) {
    const orgIds = Array.from(
      new Set(rows.map((row) => row.org_id).filter(Boolean))
    ) as string[]
    if (orgIds.length > 0) {
      const orgRows = await query<{ id: string; name: string }>(
        `select id, name from organisations where id in (${orgIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        orgIds
      )
      const orgMap = new Map(orgRows.map((org) => [org.id, { name: org.name }]))
      rows = rows.map((row) => ({
        ...row,
        organisations: orgMap.get(row.org_id as string) ?? null,
      }))
    }
  }

  if (table === 'influencer_match_requests' && select.includes('influencers!')) {
    const ids = Array.from(
      new Set(rows.map((row) => row.selected_influencer_id).filter(Boolean))
    ) as string[]
    if (ids.length > 0) {
      const infRows = await query<{
        id: string
        name: string
        handle: string | null
      }>(
        `select id, name, handle from influencers where id in (${ids.map((_, i) => `$${i + 1}`).join(', ')})`,
        ids
      )
      const infMap = new Map(
        infRows.map((inf) => [
          inf.id,
          { name: inf.name, handle: inf.handle },
        ])
      )
      rows = rows.map((row) => ({
        ...row,
        influencers:
          infMap.get(row.selected_influencer_id as string) ?? null,
      }))
    }
  }

  return rows
}

export function createAdminClient(): {
  from(table: string): PgQueryBuilder<any>
  auth: {
    admin: {
      inviteUserByEmail(
        email: string,
        options?: unknown
      ): Promise<{
        data: { user: { id: string; email: string } }
        error: QueryError | null
      }>
      deleteUser(id: string): Promise<{ data: null; error: QueryError | null }>
    }
  }
} {
  return {
    from(table: string) {
      return new PgQueryBuilder(table)
    },
    auth: {
      admin: {
        async inviteUserByEmail(
          email: string,
          _options?: unknown
        ): Promise<{
          data: { user: { id: string; email: string } }
          error: QueryError | null
        }> {
          return {
            data: { user: { id: randomUUID(), email } },
            error: null,
          }
        },
        async deleteUser(
          id: string
        ): Promise<{ data: null; error: QueryError | null }> {
          await query('delete from users where id = $1', [id])
          return { data: null, error: null }
        },
      },
    },
  }
}

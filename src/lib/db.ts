import { SupabaseClient } from '@supabase/supabase-js';

// Helper function to safely handle string values
const ensureString = (value: string | null | undefined): string => {
  if (typeof value === 'string') return value;
  return '';
};

interface QueryResult<T> {
  data: T[] | null;
  error: any;
  count?: number;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: any;
}

// Type-safe query builder
export class QueryBuilder<T = any> {
  constructor(private query: any) {}

  eq(field: string, value: string | null | undefined) {
    return new QueryBuilder<T>(this.query.eq(field, ensureString(value)));
  }

  static from<T>(supabase: SupabaseClient, table: string) {
    return new QueryBuilder<T>(supabase.from(table));
  }

  select(columns: string = '*', options?: { count?: 'exact' }) {
    return new QueryBuilder<T>(this.query.select(columns, options));
  }

  async single(): Promise<SingleQueryResult<T>> {
    const result = await this.query.single();
    return {
      data: result.data as T | null,
      error: result.error
    };
  }

  order(column: string, options?: { ascending?: boolean }) {
    return new QueryBuilder<T>(this.query.order(column, options));
  }

  range(from: number, to: number) {
    return new QueryBuilder<T>(this.query.range(from, to));
  }

  is(field: string, value: any) {
    return new QueryBuilder<T>(this.query.is(field, value));
  }

  insert(values: Partial<T>) {
    return new QueryBuilder<T>(this.query.insert(values));
  }

  update(values: Partial<T>) {
    return new QueryBuilder<T>(this.query.update(values));
  }

  async then<TResult1 = QueryResult<T>>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | undefined
  ): Promise<TResult1> {
    const result = await this.query;
    const queryResult: QueryResult<T> = {
      data: result.data as T[] | null,
      error: result.error,
      count: result.count
    };
    return onfulfilled ? onfulfilled(queryResult) : queryResult as any;
  }
}
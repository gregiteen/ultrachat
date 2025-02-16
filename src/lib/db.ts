import { SupabaseClient } from '@supabase/supabase-js';

export class QueryBuilder<T = any> {
  private query: any;

  constructor(private client: SupabaseClient, private table: string) {
    this.query = client.from(table);
  }

  select(columns: string, options?: { count?: 'exact' | null }) {
    this.query = this.query.select(columns, options);
    return this;
  }

  eq(column: string, value: any) {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.query = this.query.neq(column, value);
    return this;
  }

  gt(column: string, value: any) {
    this.query = this.query.gt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.query = this.query.gte(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.query = this.query.lt(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.query = this.query.lte(column, value);
    return this;
  }

  is(column: string, value: any) {
    this.query = this.query.is(column, value);
    return this;
  }

  in(column: string, values: any[]) {
    this.query = this.query.in(column, values);
    return this;
  }

  contains(column: string, value: any) {
    this.query = this.query.contains(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    return this;
  }

  single() {
    this.query = this.query.single();
    return this;
  }

  maybeSingle() {
    this.query = this.query.maybeSingle();
    return this;
  }

  insert(values: Partial<T>) {
    this.query = this.query.insert(values);
    return this;
  }

  update(values: Partial<T>) {
    this.query = this.query.update(values);
    return this;
  }

  delete() {
    this.query = this.query.delete();
    return this;
  }

  async execute(): Promise<{ 
    data: T | T[] | null;
    error: Error | null;
    count?: number | null;
  }> {
    try {
      const result = await this.query;
      return {
        data: result.data as T | T[],
        error: result.error,
        count: result.count
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  }
}

// Helper function to create a new query builder
export function createQuery<T>(client: SupabaseClient, table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(client, table);
}
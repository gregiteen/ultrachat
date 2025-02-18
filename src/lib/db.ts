import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

export class QueryBuilder<T = any> {
  private query: any;

  constructor(private client: SupabaseClient, private table: string) {
    // Use table name directly - PostgREST will handle schema mapping
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

  order(column: string, options?: { ascending: boolean; nullsFirst?: boolean; foreignTable?: string }) {
    if (options?.foreignTable) {
      this.query = this.query.order(column, { ascending: options.ascending, nullsFirst: options.nullsFirst, foreignTable: options.foreignTable });
    } else {
      this.query = this.query.order(column, { ascending: options?.ascending ?? true, nullsFirst: options?.nullsFirst });
    }
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
    error: PostgrestError | null;
    count?: number | null;
  }> {
    try {
      // Log query details
      console.log('Query details:', {
        table: this.table,
        url: this.query.url?.toString(),
        method: this.query.method,
        headers: this.query.headers
      });

      const result = await this.query;
      
      // Handle common error cases
      if (result.error) {
        const pgError = result.error as PostgrestError;

        // Handle invalid query
        console.error('Query error:', {
          code: pgError.code,
          message: pgError.message,
          details: pgError.details,
          hint: pgError.hint,
          query: this.query.url?.toString()
        }, 'Full result:', result);

        // Other database errors
        return {
          data: null,
          error: pgError,
        };
      }

      // Ensure data is properly typed
      const data = result.data;
      if (Array.isArray(data)) {
        // Filter out any invalid values from array
        return {
          data: data.filter((item): item is T => item !== null && typeof item === 'object'),
          error: null,
          count: result.count
        };
      }

      // Handle null data
      if (data === null) {
        return {
          data: [] as T[],
          error: null
        };
      }

      // Handle single item result
      return {
        data: data as T,
        error: null,
        count: result.count
      };

    } catch (error) {
      // Handle unexpected errors
      console.error('Unexpected database error:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown database error',
          details: '',
          hint: '',
          code: 'UNKNOWN',
          name: 'UnknownError',
        } as PostgrestError
      };
    }
  }
}

// Helper function to create a new query builder
export function createQuery<T>(client: SupabaseClient, table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(client, table);
}

// Helper function to call RPC functions
export async function callRpc<T = any>(
  client: SupabaseClient,
  functionName: string,
  params?: Record<string, any>
): Promise<{
  data: T | null;
  error: PostgrestError | null;
}> {
  try {
    // Call RPC function directly - PostgREST will handle schema mapping
    const result = await client.rpc(functionName, params);

    if (result.error) {
      const pgError = result.error as PostgrestError;
      
      // Function not found
      if (pgError.code === '404' || pgError.code === 'PGRST202' || pgError.code === '42883') {
        console.error(`Function "${functionName}" not found:`, pgError);
        return {
          data: null,
          error: {
            ...pgError,
            message: `Function "${functionName}" not found`,
            code: pgError.code
          } as PostgrestError
        };
      }

      // Other errors
      return {
        data: null,
        error: pgError
      };
    }

    return {
      data: result.data as T,
      error: null
    };
  } catch (error) {
    console.error(`Error calling RPC function "${functionName}":`, error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown RPC error',
        details: '',
        hint: '',
        code: 'UNKNOWN',
        name: 'UnknownError',
      } as PostgrestError
    };
  }
}
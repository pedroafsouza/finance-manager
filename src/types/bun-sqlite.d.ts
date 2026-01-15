declare module 'bun:sqlite' {
  export class Database {
    constructor(filename: string, options?: { readonly?: boolean; create?: boolean });

    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
    pragma(sql: string, options?: { simple?: boolean }): any;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }

  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export class Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    values(...params: any[]): any[][];
    finalize(): void;
  }
}

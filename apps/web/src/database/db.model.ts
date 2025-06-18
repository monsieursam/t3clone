import Dexie, { Table } from 'dexie';

// table inteface
export interface ApiKeyOpenRouter {
  id?: number;
  key: string;
}

export class DB extends Dexie {
  // table name is student
  apiKeyOpenRouter!: Table<ApiKeyOpenRouter>;
  constructor() {
    super('myDatabase');
    this.version(1).stores({
      apiKeyOpenRouter: '++id, key'
    });
  }
}

export const db = new DB(); // export the db

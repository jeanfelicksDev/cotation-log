import Dexie, { Table } from 'dexie';

export interface LocalQuotation {
  id: string; // Internal ID or random string
  remoteId?: string; // Prisma ID if synced
  reference: string;
  clientName: string;
  origin: string;
  destination: string;
  totalFinal: number;
  status: string;
  clientResponseDate?: string | Date;
  direction: string;
  commodity: string;
  mode: string;
  createdAt: Date;
  updatedAt: Date;
  isSynced: boolean;
  isDeleted?: boolean;
}

export interface SyncAction {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'QUOTATION';
  entityId: string;
  data: any;
  timestamp: number;
}

export class AppDatabase extends Dexie {
  quotations!: Table<LocalQuotation>;
  syncQueue!: Table<SyncAction>;

  constructor() {
    super('CotaLogDB');
    this.version(1).stores({
      quotations: 'id, remoteId, clientName, status, isSynced',
      syncQueue: '++id, entityId, type'
    });
  }
}

export const db = new AppDatabase();

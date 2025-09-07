export interface SyncITem {
    id: number;
    table_name: string;
    sync_created: Date | null; // ✅ Accepter explicitement null
}
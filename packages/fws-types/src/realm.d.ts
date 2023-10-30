import type { TimeResponse } from './utils';
export interface Realm {
    UUID: string;
    CreatedAt?: TimeResponse;
    UpdatedAt?: TimeResponse;
    Name: string;
    DeletedAt?: TimeResponse | null;
    Deleted: boolean;
    Locales: string[];
};

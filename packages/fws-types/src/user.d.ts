import type { TimeResponse } from "./utils";
import type { Realm } from "./realm";

interface UserRole {
    Role: string;
    RealmUUID: string;
}

interface User {
    UUID: string;
    CreatedAt: TimeResponse;
    UpdatedAt: TimeResponse;
    LoggedAt?: TimeResponse;
    Email: string;
    Username: string;
    Password: string;
    Firstname?: string | null;
    Lastname?: string | null;
    Phone?: string | null;
    Bio?: string | null;
    RealmUUID: string;
    Realm: Realm; 
    Roles?: UserRole[];
    FacebookID?: string | null;
    GoogleID?: string | null;
    TwitterID?: string | null;
    GithubID?: string | null;
    PatreonPledges?: Record<string, any>;
}
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
    Password: string;
    Firstname?: string | null;
    Lastname?: string | null;
    Phone?: string | null;
    Bio?: string | null;
    RealmUUID: string;
    Realm: Realm; 
    Roles?: UserRole[];
    PatreonPledges?: Record<string, any>;
    AcceptedTerms: boolean;
    EnabledNotifications: boolean;
    EnabledEmails: boolean;
    EnabledTrainingFromMyData: boolean;
    EnabledDarkMode: boolean;
    EnabledAdultContent: boolean;
    UserProfile?: UserProfile;
}

interface UserProfile {
    UUID: string;
    Username: string;
    Slug: string
    Gender: string;
    Bio: string;
    Birthdate: TimeResponse;
    PublicGender: boolean;
    PublicBio: boolean;
    PublicBirthdate: boolean;
    HasUsernameAndSlug: boolean;
    CreatedAt: TimeResponse;
    UpdatedAt: TimeResponse;
    AvatarUUID?: string;
}

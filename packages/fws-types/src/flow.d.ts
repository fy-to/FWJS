export interface KlbUserFlowButton {
    "background-color": string;
    logo: string;
}

export interface KlbUserFlowField {
    cat?: string;
    label?: string;
    type: string;
    name: string;
    button?: KlbUserFlowButton;
    id?: KlbUUID;
    info?: any; // too lazy
    style?: string;
    link?: string;
}

export interface KlbFlowData {
    fields: KlbUserFlowField[];
    message?: string;
    req: string[];
    session: string;
    complete: boolean;
    email: string | null;
    initial: boolean;
    url?: string;
    user?: KlbUser;
    Redirect?: string;
}
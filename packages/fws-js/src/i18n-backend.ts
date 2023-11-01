import { hasFW, getPrefix } from './fws-wrapper';
import type { BackendModule, Services, TOptions } from 'i18next';

interface BackendOptions {
    allowMultiLoading?: boolean;
}

const defaults: TOptions = {
    allowMultiLoading: false,
};

class I18nBackend implements BackendModule<BackendOptions> {
    private options: BackendOptions;

    type: 'backend';
    static type: string = 'backend';
    
    constructor(services: Services, options?: BackendOptions) {
        this.init(services, options);
        this.type = "backend";
        this.options = options || {};
    }

    init(services: Services, options: BackendOptions = {}): void {
        this.options = {
            ...defaults,
            ...this.options,
            ...options,
        };
    }

    read(language: string, namespace: string, callback: (error: any, data?: any) => void): void {
        if (language.length !== 5) {
            callback(null, {});
            return;
        }

        let pfx = hasFW() ? getPrefix() : "";
        const newpfx = pfx.replace(/\/l\/[a-z]{2}-[A-Z]{2}/, "/l/" + language) || "/l/" + language;

        fetch(newpfx + "/_special/locale.json")
            .catch(() => fetch("/_special/locale/" + language + ".json"))
            .then(res => {
                if (!res.ok) {
                    const retry = res.status >= 500 && res.status < 600;
                    callback(`failed loading i18n`, retry);
                    return;
                }
                return res.json();
            })
            .then(res => { callback(null, res); })
            .catch(err => {
                callback(err, false);
            });
    }
}

export { I18nBackend };
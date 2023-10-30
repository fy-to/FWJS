import { hasFW, getPrefix } from './fws-wrapper';
interface BackendOptions {
    allowMultiLoading?: boolean;
}

interface Services {
    // You might want to define the structure of services here
    // or you can use 'any' for now and specify it later.
    [key: string]: any;
}

const defaults: BackendOptions = {
    allowMultiLoading: false,
};

class Backend {
    private options: BackendOptions;

    public static type = 'backend';
    public type: string;

    constructor(services: Services, options?: BackendOptions) {
        this.init(services, options);
        this.type = 'backend';
        this.options = {
            ...defaults,
            ...options,
        };
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
        /*
        if ((typeof FW !== "undefined") && (language === FW.Locale) && (typeof FW.i18n !== "undefined")) {
          callback(null, FW.i18n);
          return;
        }*/

        let pfx = hasFW() ? getPrefix() : "";
        const newpfx = pfx.replace(/\/l\/[a-z]{2}-[A-Z]{2}/, "/l/" + language) || "/l/" + language;

        fetch(newpfx + "/_special/locale.json")
            .catch(err => fetch("/_special/locale/" + language + ".json"))
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

export { Backend };
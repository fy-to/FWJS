export type RestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
export interface RestParams {
    [key: string]: any;
}

function getRestURL(path: string): string {
    return "/_special/rest/" + path;
}

function getTzPad(number: number, length: number): string {
    let str = String(number);
    while (str.length < length) {
        str = "0" + str;
    }
    return str;

}

function getTimezoneData(): string {
    let offset = new Date().getTimezoneOffset();
    let offsetTz = ((offset < 0 ? '+' : '-') + getTzPad(Math.abs(offset / 60), 2) + getTzPad(Math.abs(offset % 60), 2));

    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat !== 'undefined') {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return timezone + ";" + offsetTz;
    }
    return offsetTz;
}

function parseRestResponse(response: Response, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    var contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") == -1) {
        response.text().then(function (text: string) {
            reject({ message: "Not JSON", body: text, headers: response.headers });
        }).catch(reject);

        return;
    }

    response.json().then(function (json: any) {
        if (json.result != "success" && json.result != "redirect") {
            json.headers = response.headers;
            reject(json);
        } else {
            resolve(json);
        }
    }).catch(reject);
}

export async function rest(
    path: string,
    method: RestMethod,
    params?: RestParams,
): Promise<any> {
    let callUrl = getRestURL(path);
    let body: string | null = null;

    params = params ?? {};
    params['__tz'] = getTimezoneData();
    if (params && (method === 'GET' || method === 'DELETE')) {
        callUrl = callUrl + "?_=" + encodeURIComponent(JSON.stringify(params));
    } else if (params && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        body = JSON.stringify(params);
    }

    const restResolved = function (data: Response) {
        return new Promise((resolve, reject) => {
            parseRestResponse(data, resolve, reject);
        });
    }
    const restRejected = restResolved;
    const restCatch = function (data: Response) {
        console.log(data);
    }

    return fetch(callUrl, {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body,
    }).then(restResolved, restRejected).catch(restCatch)
}
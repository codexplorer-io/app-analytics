export type EventAttributeValue = string | number | boolean | null | undefined;
export type EventAttributes = Record<string, EventAttributeValue>;

export interface FirebaseInitParams {
    config?: EventAttributes;
    options?: EventAttributes;
}

export interface AnalyticsInitializeParams {
    firebase?: FirebaseInitParams;
    amplify?: EventAttributes;
    facebook?: EventAttributes;
}

export interface SendEventParams {
    name: string;
    attributes?: EventAttributes;
}

export interface SendScreenEventParams {
    screenName: string;
    attributes?: EventAttributes;
}

export declare function initialize(params?: AnalyticsInitializeParams): void;
export declare function sendEvent(params: SendEventParams): void;
export declare function sendScreenEvent(params: SendScreenEventParams): void;
export declare function setUserId(userId: string): void;
export declare function setUserProperties(properties: EventAttributes): void;

import keys from 'lodash/keys';
import map from 'lodash/map';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
import forIn from 'lodash/forIn';
import startsWith from 'lodash/startsWith';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isNil from 'lodash/isNil';

const encodeQueryArgs = (queryArgs, lastTime) => {
    let keysArray = keys(queryArgs);
    if (lastTime < 0) {
        keysArray = filter(keysArray, key => key !== '_et');
    }
    return map(keysArray, key => `${key}=${encodeURIComponent(
        key === '_et' ? Math.max(queryArgs[key] - lastTime, 0) : queryArgs[key]
    )}`).join('&');
};

const SHORT_EVENT_PARAMS = {
    currency: 'cu'
};

/**
 * A pure JavaScript Google Firebase Analytics implementation that uses
 * the HTTPS Measurement API 2 to send events to Google Analytics.
 *
 * This class provides an alternative for the Firebase Analytics module
 * shipped with the Firebase JS SDK. That library uses the gtag.js dependency
 * and requires certain browser features. This prevents the use
 * analytics on other platforms, such as Node-js and react-native.
 *
 * FirebaseAnalytics provides a bare-bone implementation of the new
 * HTTPS Measurement API 2 protocol (which is undocumented), with an API
 * that follows the Firebase Analytics JS SDK.
 */
export class FirebaseAnalytics {
    url;

    enabled;

    config;

    userId;

    userProperties;

    screenName;

    eventQueue = new Set();

    options;

    flushEventsPromise = Promise.resolve();

    flushEventsTimer;

    lastTime = -1;

    sequenceNr = 1;

    constructor(config, options) {
        if (!config.measurementId) {
            throw new Error(
                'No valid measurementId. Make sure to provide a valid measurementId with a G-XXXXXXXXXX format.'
            );
        }

        if (!options.clientId) {
            throw new Error(
                'No valid clientId. Make sure to provide a valid clientId with a UUID (v4) format.'
            );
        }

        this.url = 'https://www.google-analytics.com/g/collect';
        this.enabled = true;
        this.config = config;
        this.options = {
            customArgs: {},
            maxCacheTime: 5000,
            origin: 'firebase',
            ...options
        };
    }

    /**
     * Sends 1 or more coded-events to the back-end.
     * When only 1 event is provided, it is send inside the query URL.
     * When more than 1 event is provided, the event-data is send in
     * the body of the POST request.
     */
    async send(events) {
        const { config, options } = this;
        this.sequenceNr += 1;
        let queryArgs = {
            ...options.customArgs,
            v: 2,
            tid: config.measurementId,
            cid: options.clientId,
            sid: options.sessionId,
            _s: this.sequenceNr,
            seg: 1
        };
        if (options.sessionNumber) queryArgs.sct = options.sessionNumber;
        if (options.userLanguage) queryArgs.ul = options.userLanguage;
        if (options.appName) queryArgs.an = options.appName;
        if (options.appVersion) queryArgs.av = options.appVersion;
        if (options.docTitle) queryArgs.dt = options.docTitle;
        if (options.docLocation) queryArgs.dl = options.docLocation;
        if (options.screenRes) queryArgs.sr = options.screenRes;
        if (options.debug) queryArgs._dbg = 1;
        if (this.sequenceNr === 2) queryArgs._ss = 1;
        let body;

        const { lastTime } = this;
        if (events.size > 1) {
            body = '';
            forEach([...events], event => {
                body += `${encodeQueryArgs(event, this.lastTime)}\n`;
                this.lastTime = event._et;
            });
        } else if (events.size === 1) {
            const event = events.values().next().value;
            this.lastTime = event._et;
            queryArgs = {
                ...event,
                ...queryArgs
            };
        }
        const args = encodeQueryArgs(queryArgs, lastTime);
        const url = `${this.url}?${args}`;
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'user-agent': 'FirebaseAnalytics/1.0.0',
                ...(options.headers || {})
            },
            body
        });
    }

    async addEvent(event) {
        const {
            userId,
            userProperties,
            screenName,
            options
        } = this;

        // Extend the event with the currently set User-id
        if (userId) event.uid = userId;
        if (screenName) event['ep.screen_name'] = screenName;

        // Add user-properties
        if (userProperties) {
            forIn(userProperties, (_, name) => {
                event[name] = userProperties[name];
            });

            // Reset user-properties after the first event. This is what gtag.js seems
            // to do as well, although I couldn't find any docs explaining this behavior.
            this.userProperties = undefined;
        }

        // Add the event to the queue
        this.eventQueue.add(event);

        // Start debounce timer
        if (!this.flushEventsTimer) {
            this.flushEventsTimer = setTimeout(
                async () => {
                    this.flushEventsTimer = undefined;
                    try {
                        await this.flushEventsPromise;
                    } catch (err) {
                        // nop
                    }
                    this.flushEventsPromise = this.flushEvents();
                },
                options.debug ? 10 : options.maxCacheTime
            );
        }
    }

    async flushEvents() {
        if (!this.eventQueue.size) return;
        const events = new Set(this.eventQueue);
        await this.send(events);
        forEach([...events], event => this.eventQueue.delete(event));
    }

    /**
     * Clears any queued events and cancels the flush timer.
     */
    clearEvents() {
        this.eventQueue.clear();
        if (this.flushEventsTimer) {
            clearTimeout(this.flushEventsTimer);
            this.flushEventsTimer = 0;
        }
    }

    static isValidName(name, maxLength) {
        return !!(
            name &&
            name.length &&
            name.length <= maxLength &&
            name.match(/^[A-Za-z][A-Za-z_\d]*$/) &&
            !startsWith(name, 'firebase_') &&
            !startsWith(name, 'google_') &&
            !startsWith(name, 'ga_')
        );
    }

    /**
     * Parses an event (as passed to logEvent) and throws an error when the
     * event-name or parameters are invalid.
     *
     * Upon success, returns the event in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseEvent(
        options,
        eventName,
        eventParams
    ) {
        if (!FirebaseAnalytics.isValidName(eventName, 40)) {
            throw new Error(
                `Invalid event-name (${eventName}) specified. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character.`
            );
        }

        const params = {
            en: eventName,
            _et: Date.now(),
            'ep.origin': options.origin
        };

        if (eventParams) {
            forIn(eventParams, (_, key) => {
                const paramKey =
                    SHORT_EVENT_PARAMS[key] ||
                    (isNumber(eventParams[key]) ? `epn.${key}` : `ep.${key}`);
                params[paramKey] = eventParams[key];
            });
        }

        return params;
    }

    /**
     * Parses user-properties (as passed to setUserProperties) and throws an error when
     * one of the user properties is invalid.
     *
     * Upon success, returns the user-properties in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseUserProperty(
        options,
        userPropertyName,
        userPropertyValue
    ) {
        if (!FirebaseAnalytics.isValidName(userPropertyName, 24) || userPropertyName === 'user_id') {
            throw new Error(
                `Invalid user-property name (${userPropertyName}) specified. Should contain 1 to 24 alphanumeric characters or underscores. The name must start with an alphabetic character.`
            );
        }
        if (
            !isNil(userPropertyValue) &&
            (!isString(userPropertyValue) || userPropertyValue.length > 36)
        ) {
            throw new Error(
                'Invalid user-property value specified. Value should be a string of up to 36 characters long.'
            );
        }
        return isNumber(userPropertyValue) ?
            `upn.${userPropertyName}` :
            `up.${userPropertyName}`;
    }

    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    async logEvent(eventName, eventParams) {
        const event = FirebaseAnalytics.parseEvent(this.options, eventName, eventParams);
        if (!this.enabled) return;
        if (this.options.debug) {
            // eslint-disable-next-line no-console
            console.log(
                `FirebaseAnalytics event: "${eventName}", params: ${JSON.stringify(
                    eventParams,
                    undefined,
                    2
                )}`
            );
        }
        await this.addEvent(event);
    }

    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    async setAnalyticsCollectionEnabled(isEnabled) {
        this.enabled = isEnabled;
    }

    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    async setCurrentScreen(screenName) {
        if (screenName && screenName.length > 100) {
            throw new Error(
                'Invalid screen-name specified. Should contain 1 to 100 characters. Set to undefined to clear the current screen name.'
            );
        }
        if (!this.enabled) return;
        this.screenName = screenName || undefined;
    }

    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    async setUserId(userId) {
        if (!this.enabled) return;
        this.userId = userId || undefined;
    }

    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    async setUserProperties(userProperties) {
        if (!this.enabled) return;
        forIn(userProperties, (_, name) => {
            const val = userProperties[name];
            const key = FirebaseAnalytics.parseUserProperty(this.options, name, val);
            if (isNil(val)) {
                if (this.userProperties) {
                    delete this.userProperties[key];
                }
            } else {
                this.userProperties = this.userProperties || {};
                this.userProperties[key] = val;
            }
        });
    }

    /**
     * Clears all analytics data for this instance.
     */
    async resetAnalyticsData() {
        this.clearEvents();
        this.screenName = undefined;
        this.userId = undefined;
        this.userProperties = undefined;
    }

    /**
     * Enables or disabled debug mode.
     */
    async setDebugModeEnabled(isEnabled) {
        this.options.debug = isEnabled;
    }
}

import { enableFetchMocks, disableFetchMocks } from 'jest-fetch-mock';
import constant from 'lodash/constant';
import { FirebaseAnalytics } from './firebase-analytics';

const RealDate = global.Date;

describe('firebase-analytics', () => {
    const defaultConfig = {
        measurementId: 'mockMeasurementId'
    };

    const defaultOptions = {
        clientId: 'mockClientId',
        sessionId: 'mockSession',
        appName: 'mockAppName',
        appVersion: 'mockAppVersion',
        sessionNumber: 'mockSessionNumber',
        userLanguage: 'mockUserLanguage',
        docTitle: 'mockDocTitle',
        docLocation: 'mockDocLocation',
        screenRes: 'mockScreenRes'
    };

    beforeAll(() => {
        enableFetchMocks();
        jest.useFakeTimers();
        global.Date = {
            now: constant(1616660254772)
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    afterAll(() => {
        disableFetchMocks();
        jest.useRealTimers();
        global.Date = RealDate;
    });

    describe('initialization', () => {
        it('should be correctly initialized', () => {
            const options = {
                ...defaultOptions,
                optionProp1: 'optionVal1',
                optionProp2: 'optionVal2'
            };

            const result = new FirebaseAnalytics(defaultConfig, options);

            expect(result.config).toEqual(defaultConfig);
            expect(result.options).toEqual({
                customArgs: {},
                maxCacheTime: 5000,
                origin: 'firebase',
                ...options
            });
            expect(result.url).toBe('https://www.google-analytics.com/g/collect');
            expect(result.enabled).toBe(true);
        });

        it('should throw an error when measurementId is not provided', () => {
            let error = null;

            try {
                // eslint-disable-next-line no-new
                new FirebaseAnalytics({}, defaultOptions);
            } catch (err) {
                error = err;
            }

            expect(error.message).toBe(
                'No valid measurementId. Make sure to provide a valid measurementId with a G-XXXXXXXXXX format.'
            );
        });

        it('should throw an error when clientId is not provided', () => {
            let error = null;

            try {
                // eslint-disable-next-line no-new
                new FirebaseAnalytics(defaultConfig, {});
            } catch (err) {
                error = err;
            }

            expect(error.message).toBe(
                'No valid clientId. Make sure to provide a valid clientId with a UUID (v4) format.'
            );
        });
    });

    describe('logEvent', () => {
        it('should send event', async () => {
            const result = new FirebaseAnalytics(defaultConfig, defaultOptions);
            result.setCurrentScreen('mock_screen');
            result.setUserId('mock_user');
            result.setUserProperties({
                userProp1: 'userVal1',
                userProp2: 'userVal2'
            });

            expect(result.flushEventsTimer).toBeUndefined();
            expect(result.eventQueue.size).toBe(0);

            result.logEvent('mock_event', {
                param1: 'val1',
                param2: 'val2'
            });

            expect(result.flushEventsTimer).not.toBeUndefined();
            expect(result.eventQueue.size).toBe(1);
            expect(fetch).not.toHaveBeenCalled();

            await jest.advanceTimersByTime(5000);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(
                'https://www.google-analytics.com/g/collect?en=mock_event&ep.origin=firebase&ep.param1=val1&ep.param2=val2&uid=mock_user&ep.screen_name=mock_screen&up.userProp1=userVal1&up.userProp2=userVal2&v=2&tid=mockMeasurementId&cid=mockClientId&sid=mockSession&_s=2&seg=1&sct=mockSessionNumber&ul=mockUserLanguage&an=mockAppName&av=mockAppVersion&dt=mockDocTitle&dl=mockDocLocation&sr=mockScreenRes&_ss=1',
                {
                    body: undefined,
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'text/plain;charset=UTF-8',
                        'user-agent': 'FirebaseAnalytics/1.0.0'
                    },
                    method: 'POST',
                    mode: 'no-cors'
                }
            );
            expect(result.eventQueue.size).toBe(1);

            await result.flushEventsPromise;

            expect(result.eventQueue.size).toBe(0);
        });

        it('should send multiple events', async () => {
            const result = new FirebaseAnalytics(defaultConfig, defaultOptions);
            result.setCurrentScreen('mock_screen');
            result.setUserId('mock_user');
            result.setUserProperties({
                userProp1: 'userVal1',
                userProp2: 'userVal2'
            });
            result.logEvent('mock_event_1', {
                param1: 'val1',
                param2: 'val2'
            });
            result.logEvent('mock_event_2', {
                param1: 'val1',
                param2: 'val2'
            });

            await jest.advanceTimersByTime(5000);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(
                'https://www.google-analytics.com/g/collect?v=2&tid=mockMeasurementId&cid=mockClientId&sid=mockSession&_s=2&seg=1&sct=mockSessionNumber&ul=mockUserLanguage&an=mockAppName&av=mockAppVersion&dt=mockDocTitle&dl=mockDocLocation&sr=mockScreenRes&_ss=1',
                {
                    body: 'en=mock_event_1&ep.origin=firebase&ep.param1=val1&ep.param2=val2&uid=mock_user&ep.screen_name=mock_screen&up.userProp1=userVal1&up.userProp2=userVal2\nen=mock_event_2&_et=0&ep.origin=firebase&ep.param1=val1&ep.param2=val2&uid=mock_user&ep.screen_name=mock_screen\n',
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'text/plain;charset=UTF-8',
                        'user-agent': 'FirebaseAnalytics/1.0.0'
                    },
                    method: 'POST',
                    mode: 'no-cors'
                }
            );
        });
    });
});

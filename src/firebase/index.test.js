import { FirebaseAnalytics } from './firebase-analytics';

jest.mock('./firebase-analytics', () => {
    const FirebaseAnalytics = jest.fn();

    return {
        FirebaseAnalytics
    };
});

describe('Firebase analytics', () => {
    const defaultConfig = {
        config: 'mockConfig',
        options: 'mockOptions'
    };
    let initialize;
    let sendEvent;
    let sendScreenEvent;
    let setUserId;
    let setUserProperties;
    let firebase;

    beforeEach(() => {
        jest.isolateModules(() => {
            // eslint-disable-next-line global-require
            const module = require('./index');
            initialize = module.initialize;
            sendEvent = module.sendEvent;
            sendScreenEvent = module.sendScreenEvent;
            setUserId = module.setUserId;
            setUserProperties = module.setUserProperties;
        });

        // eslint-disable-next-line func-names
        FirebaseAnalytics.mockImplementation(function () {
            firebase = this;
            this.logEvent = jest.fn();
            this.setCurrentScreen = jest.fn();
            this.setUserId = jest.fn();
            this.setUserProperties = jest.fn();
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should be correctly initialized', () => {
            initialize(defaultConfig);

            expect(FirebaseAnalytics).toHaveBeenCalledTimes(1);
            expect(FirebaseAnalytics).toHaveBeenCalledWith('mockConfig', 'mockOptions');
        });

        it('should not initialize when no config', () => {
            initialize(null);

            expect(FirebaseAnalytics).not.toHaveBeenCalled();
        });

        it('should throw an error when analytics initialization fails', () => {
            // eslint-disable-next-line func-names, prefer-arrow-callback
            FirebaseAnalytics.mockImplementation(function () {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
            } catch (error) {
                expect(error.message).toBe('mock error');
            }
        });
    });

    describe('sendEvent', () => {
        it('should send event without attributes', () => {
            initialize(defaultConfig);

            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith('mock_event', {});
        });

        it('should send event with attributes', () => {
            initialize(defaultConfig);

            sendEvent({
                name: 'mock_event',
                attributes: {
                    hello: 'world',
                    lorem: 'ipsum'
                }
            });

            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith(
                'mock_event',
                {
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                }
            );
        });

        it('should not send event if not initialized', () => {
            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });

        it('should not send event if configuration is not passed on initialization', () => {
            initialize(null);

            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });

        it('should not send event if initialization failed', () => {
            // eslint-disable-next-line func-names, prefer-arrow-callback
            FirebaseAnalytics.mockImplementation(function () {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });
    });

    describe('sendScreenEvent', () => {
        it('should send screen event without attributes', () => {
            initialize(defaultConfig);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(firebase.setCurrentScreen).toHaveBeenCalledTimes(1);
            expect(firebase.setCurrentScreen).toHaveBeenCalledWith('dummyScreen');
            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith(
                'screen_view',
                {
                    screen_name: 'dummyScreen'
                }
            );
        });

        it('should send screen event with attributes', () => {
            initialize(defaultConfig);

            sendScreenEvent({
                screenName: 'dummyScreen',
                attributes: {
                    hello: 'world',
                    lorem: 'ipsum'
                }
            });

            expect(firebase.setCurrentScreen).toHaveBeenCalledTimes(1);
            expect(firebase.setCurrentScreen).toHaveBeenCalledWith('dummyScreen');
            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith(
                'screen_view',
                {
                    screen_name: 'dummyScreen',
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                }
            );
        });

        it('should send events with correct screen name', () => {
            initialize(defaultConfig);

            sendEvent({ name: 'mock_event' });
            sendScreenEvent({ screenName: 'dummyScreen1' });
            sendEvent({ name: 'mock_event' });
            sendScreenEvent({ screenName: 'dummyScreen2' });
            sendEvent({ name: 'mock_event' });
            sendScreenEvent({ screenName: null });
            sendEvent({ name: 'mock_event' });

            expect(firebase.setCurrentScreen).toHaveBeenCalledTimes(3);
            expect(firebase.setCurrentScreen).toHaveBeenNthCalledWith(1, 'dummyScreen1');
            expect(firebase.setCurrentScreen).toHaveBeenNthCalledWith(2, 'dummyScreen2');
            expect(firebase.setCurrentScreen).toHaveBeenNthCalledWith(3, null);
            expect(firebase.logEvent).toHaveBeenCalledTimes(6);
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                1,
                'mock_event',
                {}
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                2,
                'screen_view',
                { screen_name: 'dummyScreen1' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                3,
                'mock_event',
                { screen_name: 'dummyScreen1' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                4,
                'screen_view',
                { screen_name: 'dummyScreen2' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                5,
                'mock_event',
                { screen_name: 'dummyScreen2' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                6,
                'mock_event',
                {}
            );
        });

        it('should not send screen event if not initialized', () => {
            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });

        it('should not send screen event if configuration is not passed on initialization', () => {
            initialize(null);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });

        it('should not send screen event if initialization failed', () => {
            // eslint-disable-next-line func-names, prefer-arrow-callback
            FirebaseAnalytics.mockImplementation(function () {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(firebase.logEvent).not.toHaveBeenCalled();
        });
    });

    describe('setUserId', () => {
        it('should set user id property', () => {
            initialize(defaultConfig);

            setUserId('mockUserId');

            expect(firebase.setUserId).toHaveBeenCalledTimes(1);
            expect(firebase.setUserId).toHaveBeenCalledWith('mockUserId');

            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith(
                'mock_event',
                { usrprop_user_id: 'mockUserId' }
            );
        });

        it('should send events with correct user id', () => {
            initialize(defaultConfig);

            sendEvent({ name: 'mock_event' });
            setUserId('user1');
            sendEvent({ name: 'mock_event' });
            setUserId('user2');
            sendEvent({ name: 'mock_event' });
            setUserId(null);
            sendEvent({ name: 'mock_event' });

            expect(firebase.setUserId).toHaveBeenCalledTimes(3);
            expect(firebase.setUserId).toHaveBeenNthCalledWith(1, 'user1');
            expect(firebase.setUserId).toHaveBeenNthCalledWith(2, 'user2');
            expect(firebase.setUserId).toHaveBeenNthCalledWith(3, null);
            expect(firebase.logEvent).toHaveBeenCalledTimes(4);
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                1,
                'mock_event',
                {}
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                2,
                'mock_event',
                { usrprop_user_id: 'user1' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                3,
                'mock_event',
                { usrprop_user_id: 'user2' }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                4,
                'mock_event',
                {}
            );
        });

        it('should send events with user id if not initialized', () => {
            setUserId('user1');
            sendEvent({ name: 'mock_event' });

            expect(firebase.setUserId).not.toHaveBeenCalled();
            expect(firebase.logEvent).not.toHaveBeenCalled();
        });
    });

    describe('setUserProperties', () => {
        it('should set user properties', () => {
            initialize(defaultConfig);

            setUserProperties({
                hello: 'world',
                lorem: 'ipsum'
            });

            expect(firebase.setUserProperties).toHaveBeenCalledTimes(1);
            expect(firebase.setUserProperties).toHaveBeenCalledWith({
                hello: 'world',
                lorem: 'ipsum'
            });

            sendEvent({ name: 'mock_event' });

            expect(firebase.logEvent).toHaveBeenCalledTimes(1);
            expect(firebase.logEvent).toHaveBeenCalledWith(
                'mock_event',
                {
                    usrprop_hello: 'world',
                    usrprop_lorem: 'ipsum'
                }
            );
        });

        it('should send events with correct user properties', () => {
            initialize(defaultConfig);

            sendEvent({ name: 'mock_event' });
            setUserProperties({
                hello1: 'world1',
                lorem1: 'ipsum1'
            });
            sendEvent({ name: 'mock_event' });
            setUserProperties({
                hello2: 'world2',
                lorem2: 'ipsum2'
            });
            sendEvent({ name: 'mock_event' });
            setUserProperties(null);
            sendEvent({ name: 'mock_event' });

            expect(firebase.setUserProperties).toHaveBeenCalledTimes(3);
            expect(firebase.setUserProperties).toHaveBeenNthCalledWith(
                1,
                {
                    hello1: 'world1',
                    lorem1: 'ipsum1'
                }
            );
            expect(firebase.setUserProperties).toHaveBeenNthCalledWith(
                2,
                {
                    hello2: 'world2',
                    lorem2: 'ipsum2'
                }
            );
            expect(firebase.setUserProperties).toHaveBeenNthCalledWith(3, null);
            expect(firebase.logEvent).toHaveBeenCalledTimes(4);
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                1,
                'mock_event',
                {}
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                2,
                'mock_event',
                {
                    usrprop_hello1: 'world1',
                    usrprop_lorem1: 'ipsum1'
                }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                3,
                'mock_event',
                {
                    usrprop_hello2: 'world2',
                    usrprop_lorem2: 'ipsum2'
                }
            );
            expect(firebase.logEvent).toHaveBeenNthCalledWith(
                4,
                'mock_event',
                {}
            );
        });

        it('should send events with user properties if not initialized', () => {
            setUserProperties({
                hello: 'world',
                lorem: 'ipsum'
            });
            sendEvent({ name: 'mock_event' });

            expect(firebase.setUserProperties).not.toHaveBeenCalled();
            expect(firebase.logEvent).not.toHaveBeenCalled();
        });
    });
});

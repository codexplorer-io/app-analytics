import { Analytics } from '@aws-amplify/analytics';

jest.mock('@aws-amplify/analytics', () => ({
    Analytics: {
        addPluggable: jest.fn(),
        autoTrack: jest.fn(),
        record: jest.fn()
    },
    AWSKinesisFirehoseProvider: function AWSKinesisFirehoseProvider() {
        this.key = 'AWSKinesisFirehoseProvider';
    }
}));

describe('Amplify analytics', () => {
    const defaultConfig = {
        firehoseStreamName: 'mockFirehoseStreamName'
    };
    let initialize;
    let sendEvent;
    let sendScreenEvent;
    let setUserId;
    let setUserProperties;

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
    });

    afterEach(() => {
        Analytics.addPluggable.mockReset();
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should be correctly initialized', () => {
            initialize(defaultConfig);

            expect(Analytics.addPluggable).toHaveBeenCalledTimes(1);
            expect(Analytics.addPluggable.mock.calls[0][0].key).toBe('AWSKinesisFirehoseProvider');
            expect(Analytics.autoTrack).toHaveBeenCalledTimes(3);
            expect(Analytics.autoTrack).toHaveBeenNthCalledWith(1, 'session', { enable: false });
            expect(Analytics.autoTrack).toHaveBeenNthCalledWith(2, 'pageView', { enable: false });
            expect(Analytics.autoTrack).toHaveBeenNthCalledWith(3, 'event', { enable: false });
        });

        it('should not initialize when no config', () => {
            initialize(null);

            expect(Analytics.addPluggable).not.toHaveBeenCalled();
            expect(Analytics.autoTrack).not.toHaveBeenCalled();
        });

        it('should throw an error when analytics initialization fails', () => {
            Analytics.addPluggable.mockImplementation(() => {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
            } catch (error) {
                expect(error.message).toBe('AWS Amplify analytics initialization failed with error: mock error');
            }
        });
    });

    describe('sendEvent', () => {
        it('should send event without attributes', () => {
            initialize(defaultConfig);

            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: { event_name: 'mock_event' },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
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

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
        });

        it('should not send event if not initialized', () => {
            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });

        it('should not send event if configuration is not passed on initialization', () => {
            initialize(null);

            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });

        it('should not send event if initialization failed', () => {
            Analytics.addPluggable.mockImplementation(() => {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });
    });

    describe('sendScreenEvent', () => {
        it('should send screen event without attributes', () => {
            initialize(defaultConfig);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: {
                    event_name: 'screen_view',
                    screen_name: 'dummyScreen'
                },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
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

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: {
                    event_name: 'screen_view',
                    screen_name: 'dummyScreen',
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
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

            expect(Analytics.record).toHaveBeenCalledTimes(6);
            expect(Analytics.record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'screen_view',
                        screen_name: 'dummyScreen1'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        screen_name: 'dummyScreen1'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                4,
                {
                    data: {
                        event_name: 'screen_view',
                        screen_name: 'dummyScreen2'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                5,
                {
                    data: {
                        event_name: 'mock_event',
                        screen_name: 'dummyScreen2'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                6,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
        });

        it('should not send screen event if not initialized', () => {
            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });

        it('should not send screen event if configuration is not passed on initialization', () => {
            initialize(null);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });

        it('should not send screen event if initialization failed', () => {
            Analytics.addPluggable.mockImplementation(() => {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });
    });

    describe('setUserId', () => {
        it('should set user id property', () => {
            initialize(defaultConfig);
            setUserId('mockUserId');

            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    usrprop_user_id: 'mockUserId'
                },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
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

            expect(Analytics.record).toHaveBeenCalledTimes(4);
            expect(Analytics.record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_user_id: 'user1'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_user_id: 'user2'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                4,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
        });

        it('should send events with user id if not initialized', () => {
            setUserId('user1');
            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });
    });

    describe('setUserProperties', () => {
        it('should set user properties', () => {
            initialize(defaultConfig);
            setUserProperties({
                hello: 'world',
                lorem: 'ipsum'
            });

            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).toHaveBeenCalledTimes(1);
            expect(Analytics.record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    usrprop_hello: 'world',
                    usrprop_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            }, 'AWSKinesisFirehose');
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

            expect(Analytics.record).toHaveBeenCalledTimes(4);
            expect(Analytics.record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_hello1: 'world1',
                        usrprop_lorem1: 'ipsum1'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_hello2: 'world2',
                        usrprop_lorem2: 'ipsum2'
                    },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
            expect(Analytics.record).toHaveBeenNthCalledWith(
                4,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                },
                'AWSKinesisFirehose'
            );
        });

        it('should send events with user properties if not initialized', () => {
            setUserProperties({
                hello: 'world',
                lorem: 'ipsum'
            });
            sendEvent({ name: 'mock_event' });

            expect(Analytics.record).not.toHaveBeenCalled();
        });
    });
});

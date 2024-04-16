import { configureAutoTrack } from 'aws-amplify/analytics';
import { record } from 'aws-amplify/analytics/kinesis-firehose';

jest.mock('aws-amplify/analytics', () => ({
    configureAutoTrack: jest.fn()
}));

jest.mock('aws-amplify/analytics/kinesis-firehose', () => ({
    record: jest.fn()
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
        configureAutoTrack.mockReset();
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should be correctly initialized', () => {
            initialize(defaultConfig);

            expect(configureAutoTrack).toHaveBeenCalledTimes(3);
            expect(configureAutoTrack).toHaveBeenNthCalledWith(1, {
                enable: false,
                type: 'session'
            });
            expect(configureAutoTrack).toHaveBeenNthCalledWith(2, {
                enable: false,
                type: 'pageView'
            });
            expect(configureAutoTrack).toHaveBeenNthCalledWith(3, {
                enable: false,
                type: 'event'
            });
        });

        it('should not initialize when no config', () => {
            initialize(null);

            expect(configureAutoTrack).not.toHaveBeenCalled();
        });

        it('should throw an error when analytics initialization fails', () => {
            configureAutoTrack.mockImplementation(() => {
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

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: { event_name: 'mock_event' },
                streamName: 'mockFirehoseStreamName'
            });
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

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            });
        });

        it('should not send event if not initialized', () => {
            sendEvent({ name: 'mock_event' });

            expect(record).not.toHaveBeenCalled();
        });

        it('should not send event if configuration is not passed on initialization', () => {
            initialize(null);

            sendEvent({ name: 'mock_event' });

            expect(record).not.toHaveBeenCalled();
        });

        it('should not send event if initialization failed', () => {
            configureAutoTrack.mockImplementation(() => {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendEvent({ name: 'mock_event' });

            expect(record).not.toHaveBeenCalled();
        });
    });

    describe('sendScreenEvent', () => {
        it('should send screen event without attributes', () => {
            initialize(defaultConfig);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: {
                    event_name: 'screen_view',
                    screen_name: 'dummyScreen'
                },
                streamName: 'mockFirehoseStreamName'
            });
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

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: {
                    event_name: 'screen_view',
                    screen_name: 'dummyScreen',
                    attr_hello: 'world',
                    attr_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            });
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

            expect(record).toHaveBeenCalledTimes(6);
            expect(record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'screen_view',
                        screen_name: 'dummyScreen1'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        screen_name: 'dummyScreen1'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                4,
                {
                    data: {
                        event_name: 'screen_view',
                        screen_name: 'dummyScreen2'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                5,
                {
                    data: {
                        event_name: 'mock_event',
                        screen_name: 'dummyScreen2'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                6,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
        });

        it('should not send repeated screen name', () => {
            initialize(defaultConfig);

            sendScreenEvent({ screenName: 'dummyScreen1' });
            sendScreenEvent({ screenName: 'dummyScreen1' });

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith(
                {
                    data: {
                        event_name: 'screen_view',
                        screen_name: 'dummyScreen1'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
        });

        it('should not send screen event if not initialized', () => {
            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(record).not.toHaveBeenCalled();
        });

        it('should not send screen event if configuration is not passed on initialization', () => {
            initialize(null);

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(record).not.toHaveBeenCalled();
        });

        it('should not send screen event if initialization failed', () => {
            configureAutoTrack.mockImplementation(() => {
                throw new Error('mock error');
            });

            try {
                initialize(defaultConfig);
                // eslint-disable-next-line no-empty
            } catch { }

            sendScreenEvent({ screenName: 'dummyScreen' });

            expect(record).not.toHaveBeenCalled();
        });
    });

    describe('setUserId', () => {
        it('should set user id property', () => {
            initialize(defaultConfig);
            setUserId('mockUserId');

            sendEvent({ name: 'mock_event' });

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    usrprop_user_id: 'mockUserId'
                },
                streamName: 'mockFirehoseStreamName'
            });
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

            expect(record).toHaveBeenCalledTimes(4);
            expect(record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_user_id: 'user1'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_user_id: 'user2'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                4,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
        });

        it('should send events with user id if not initialized', () => {
            setUserId('user1');
            sendEvent({ name: 'mock_event' });

            expect(record).not.toHaveBeenCalled();
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

            expect(record).toHaveBeenCalledTimes(1);
            expect(record).toHaveBeenCalledWith({
                data: {
                    event_name: 'mock_event',
                    usrprop_hello: 'world',
                    usrprop_lorem: 'ipsum'
                },
                streamName: 'mockFirehoseStreamName'
            });
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

            expect(record).toHaveBeenCalledTimes(4);
            expect(record).toHaveBeenNthCalledWith(
                1,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                2,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_hello1: 'world1',
                        usrprop_lorem1: 'ipsum1'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                3,
                {
                    data: {
                        event_name: 'mock_event',
                        usrprop_hello2: 'world2',
                        usrprop_lorem2: 'ipsum2'
                    },
                    streamName: 'mockFirehoseStreamName'
                }
            );
            expect(record).toHaveBeenNthCalledWith(
                4,
                {
                    data: { event_name: 'mock_event' },
                    streamName: 'mockFirehoseStreamName'
                }
            );
        });

        it('should send events with user properties if not initialized', () => {
            setUserProperties({
                hello: 'world',
                lorem: 'ipsum'
            });
            sendEvent({ name: 'mock_event' });

            expect(record).not.toHaveBeenCalled();
        });
    });
});

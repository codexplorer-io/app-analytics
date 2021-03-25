import {
    initialize as initalizeFirebase,
    sendEvent as sendEventFirebase,
    sendScreenEvent as sendScreenEventFirebase,
    setUserId as setUserIdFirebase,
    setUserProperties as setUserPropertiesFirebase
} from './firebase';
import {
    initialize as initalizeAmplify,
    sendEvent as sendEventAmplify,
    sendScreenEvent as sendScreenEventAmplify,
    setUserId as setUserIdAmplify,
    setUserProperties as setUserPropertiesAmplify
} from './amplify';
import {
    initialize,
    sendEvent,
    sendScreenEvent,
    setUserId,
    setUserProperties
} from './index';

jest.mock('./firebase', () => ({
    initialize: jest.fn(),
    sendEvent: jest.fn(),
    sendScreenEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn()
}));

jest.mock('./amplify', () => ({
    initialize: jest.fn(),
    sendEvent: jest.fn(),
    sendScreenEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn()
}));

describe('App analytics', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call underlaying initialize', () => {
        initialize({
            firebase: 'mockFirebaseConfig',
            amplify: 'mockAmplifyConfig'
        });

        expect(initalizeFirebase).toHaveBeenCalledTimes(1);
        expect(initalizeFirebase).toHaveBeenCalledWith('mockFirebaseConfig');
        expect(initalizeAmplify).toHaveBeenCalledTimes(1);
        expect(initalizeAmplify).toHaveBeenCalledWith('mockAmplifyConfig');
    });

    it('should call underlaying sendEvent', () => {
        sendEvent({
            name: 'mockEvent',
            attributes: 'mockAttributes'
        });

        expect(sendEventFirebase).toHaveBeenCalledTimes(1);
        expect(sendEventFirebase).toHaveBeenCalledWith({
            name: 'mockEvent',
            attributes: 'mockAttributes'
        });
        expect(sendEventAmplify).toHaveBeenCalledTimes(1);
        expect(sendEventAmplify).toHaveBeenCalledWith({
            name: 'mockEvent',
            attributes: 'mockAttributes'
        });
    });

    it('should call underlaying sendScreenEvent', () => {
        sendScreenEvent({
            screenName: 'mockScreen',
            attributes: 'mockAttributes'
        });

        expect(sendScreenEventFirebase).toHaveBeenCalledTimes(1);
        expect(sendScreenEventFirebase).toHaveBeenCalledWith({
            screenName: 'mockScreen',
            attributes: 'mockAttributes'
        });
        expect(sendScreenEventAmplify).toHaveBeenCalledTimes(1);
        expect(sendScreenEventAmplify).toHaveBeenCalledWith({
            screenName: 'mockScreen',
            attributes: 'mockAttributes'
        });
    });

    it('should call underlaying setUserId', () => {
        setUserId('mockUserId');

        expect(setUserIdFirebase).toHaveBeenCalledTimes(1);
        expect(setUserIdFirebase).toHaveBeenCalledWith('mockUserId');
        expect(setUserIdAmplify).toHaveBeenCalledTimes(1);
        expect(setUserIdAmplify).toHaveBeenCalledWith('mockUserId');
    });

    it('should call underlaying setUserProperties', () => {
        setUserProperties('mockUserProperties');

        expect(setUserPropertiesFirebase).toHaveBeenCalledTimes(1);
        expect(setUserPropertiesFirebase).toHaveBeenCalledWith('mockUserProperties');
        expect(setUserPropertiesAmplify).toHaveBeenCalledTimes(1);
        expect(setUserPropertiesAmplify).toHaveBeenCalledWith('mockUserProperties');
    });
});

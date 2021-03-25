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

export const initialize = ({ firebase, amplify }) => {
    initalizeFirebase(firebase);
    initalizeAmplify(amplify);
};

export const sendEvent = ({ name, attributes }) => {
    sendEventFirebase({ name, attributes });
    sendEventAmplify({ name, attributes });
};

export const sendScreenEvent = ({
    screenName,
    attributes
}) => {
    sendScreenEventFirebase({ screenName, attributes });
    sendScreenEventAmplify({ screenName, attributes });
};

export const setUserId = userId => {
    setUserIdFirebase(userId);
    setUserIdAmplify(userId);
};

export const setUserProperties = properties => {
    setUserPropertiesFirebase(properties);
    setUserPropertiesAmplify(properties);
};

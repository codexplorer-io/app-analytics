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
    initialize as initalizeFacebook,
    sendEvent as sendEventFacebook,
    sendScreenEvent as sendScreenEventFacebook,
    setUserId as setUserIdFacebook,
    setUserProperties as setUserPropertiesFacebook
} from './facebook';

export const initialize = ({
    firebase,
    amplify,
    facebook
}) => {
    initalizeFirebase(firebase);
    initalizeAmplify(amplify);
    initalizeFacebook(facebook);
};

export const sendEvent = ({ name, attributes }) => {
    sendEventFirebase({ name, attributes });
    sendEventAmplify({ name, attributes });
    sendEventFacebook({ name, attributes });
};

export const sendScreenEvent = ({
    screenName,
    attributes
}) => {
    sendScreenEventFirebase({ screenName, attributes });
    sendScreenEventAmplify({ screenName, attributes });
    sendScreenEventFacebook({ screenName, attributes });
};

export const setUserId = userId => {
    setUserIdFirebase(userId);
    setUserIdAmplify(userId);
    setUserIdFacebook(userId);
};

export const setUserProperties = properties => {
    setUserPropertiesFirebase(properties);
    setUserPropertiesAmplify(properties);
    setUserPropertiesFacebook(properties);
};

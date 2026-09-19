import reduce from 'lodash/reduce';

let facebookSdk;

const data = {};

export const initialize = config => {
    if (!config) {
        return;
    }

    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports, no-undef
    facebookSdk = require('react-native-fbsdk-next');

    data.config = config;
};

export const sendEvent = ({ name, attributes }) => {
    if (!data.config) {
        return;
    }

    facebookSdk.AppEventsLogger.logEvent(name, {
        ...(data.currentScreen ? { screen_name: data.currentScreen } : {}),
        ...(reduce(attributes, (result, value, key) => {
            result[`attr_${key}`] = value;
            return result;
        }, {})),
        ...(reduce(data.userProperties, (result, value, key) => {
            result[`usrprop_${key}`] = value;
            return result;
        }, {
            ...(data.userId ? { usrprop_user_id: data.userId } : {})
        }))
    });
};

export const sendScreenEvent = ({
    screenName,
    attributes
}) => {
    if (screenName === data.currentScreen) {
        return;
    }

    data.currentScreen = screenName;
    if (data.currentScreen) {
        sendEvent({
            name: 'screen_view',
            attributes
        });
    }
};

export const setUserId = id => {
    data.userId = id;
};

export const setUserProperties = properties => {
    data.userProperties = properties;
};

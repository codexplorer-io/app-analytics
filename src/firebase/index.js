import reduce from 'lodash/reduce';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import join from 'lodash/join';
import { FirebaseAnalytics } from './firebase-analytics';

let firebaseAnalytics = null;
const data = {};

export const initialize = config => {
    if (!config) {
        return;
    }

    firebaseAnalytics = new FirebaseAnalytics(config.config, config.options);
};

const getAnalytics = () => firebaseAnalytics;

export const sendEvent = ({ name, attributes }) => {
    if (!getAnalytics()) {
        return;
    }

    getAnalytics().logEvent(name, {
        ...(data.currentScreen ? { screen_name: data.currentScreen } : {}),
        ...(reduce(attributes, (result, value, key) => {
            if (isArray(value)) {
                value = `[${join(value, ';')}]`;
            } else if (isBoolean(value)) {
                value = value.toString();
            }

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
    if (!getAnalytics()) {
        return;
    }

    if (screenName === data.currentScreen) {
        return;
    }

    data.currentScreen = screenName;
    getAnalytics().setCurrentScreen(screenName);
    screenName && sendEvent({
        name: 'screen_view',
        attributes
    });
};

export const setUserId = userId => {
    if (!getAnalytics()) {
        return;
    }

    data.userId = userId;
    getAnalytics().setUserId(userId);
};

export const setUserProperties = properties => {
    if (!getAnalytics()) {
        return;
    }

    data.userProperties = properties;
    getAnalytics().setUserProperties(properties);
};

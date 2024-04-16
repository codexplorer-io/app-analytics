import reduce from 'lodash/reduce';
import { configureAutoTrack } from 'aws-amplify/analytics';
import { record } from 'aws-amplify/analytics/kinesis-firehose';

const data = {};

export const initialize = config => {
    if (!config) {
        return;
    }

    try {
        configureAutoTrack({
            enable: false,
            type: 'session'
        });
        configureAutoTrack({
            enable: false,
            type: 'pageView'
        });
        configureAutoTrack({
            enable: false,
            type: 'event'
        });
        data.config = config;
    } catch ({ message }) {
        throw new Error(`AWS Amplify analytics initialization failed with error: ${message}`);
    }
};

export const sendEvent = ({ name, attributes }) => {
    if (!data.config) {
        return;
    }

    record({
        data: {
            event_name: name,
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
        },
        streamName: data.config.firehoseStreamName
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
    data.currentScreen && sendEvent({
        name: 'screen_view',
        attributes
    });
};

export const setUserId = id => {
    data.userId = id;
};

export const setUserProperties = properties => {
    data.userProperties = properties;
};

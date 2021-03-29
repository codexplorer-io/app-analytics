import reduce from 'lodash/reduce';

let awsAnalytics = null;
const data = {};

export const initialize = config => {
    if (!config) {
        return;
    }

    try {
        // eslint-disable-next-line global-require
        const { Analytics, AWSKinesisFirehoseProvider } = require('@aws-amplify/analytics');
        awsAnalytics = Analytics;
        data.config = config;
        Analytics.addPluggable(new AWSKinesisFirehoseProvider());
        Analytics.autoTrack('session', { enable: false });
        Analytics.autoTrack('pageView', { enable: false });
        Analytics.autoTrack('event', { enable: false });
    } catch ({ message }) {
        awsAnalytics = null;
        throw new Error(`AWS Amplify analytics initialization failed with error: ${message}`);
    }
};

const getAnalytics = () => awsAnalytics;

export const sendEvent = ({ name, attributes }) => {
    if (!getAnalytics()) {
        return;
    }

    getAnalytics().record({
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
    }, 'AWSKinesisFirehose');
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

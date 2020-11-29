const requestPromise = require('request-promise-native');

const REQUEST_PATH = 'https://moaci-backend.herokuapp.com';

module.exports.getTipsForEnergyComsumption = async () => {
 
    const options = {
        uri: REQUEST_PATH + '/eco_friendly/tips',
        json: true
      };
      const data = await requestPromise(options);
    
      return data;

};

module.exports.getNextMonthConsumption = async (userId) => {
 
    console.log(REQUEST_PATH + '/alexa/'+ userId + '/consumption/next_month');
    const options = {
      uri: REQUEST_PATH + '/alexa/'+ userId + '/consumption/next_month',
      json: true
    };
    const data = await requestPromise(options);
  
    return data;

};

module.exports.getDeviceMaxConsumption = async (userId) => {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliances/consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data;
};

module.exports.getDevicesTurnOn = async (userId) => {
  const options = {
    uri: REQUEST_PATH + '/alexa/' + userId + '/home_appliances/connected',
    json: true
  };
  const data = await requestPromise(options);

  return data;
};

module.exports.getConsumptionByDate = async (userId, year, month) => {
  console.log('user id for request ' + userId);
  console.log(REQUEST_PATH + '/alexa/'+userId+'/consumption/date?year=' + year + '&month='+month);

  const options = {
    uri: REQUEST_PATH + '/alexa/'+userId+'/consumption/date?year=' + year + '&month='+month,
    json: true
  };
  const data = await requestPromise(options);

  return data;
};

module.exports.getCurrentConsumption = async (userId) => {
  console.log('Current path ' + REQUEST_PATH);
  console.log('user id for request ' + userId);
  console.log(REQUEST_PATH + '/alexa/'+userId+'/consumption/now')
  const options = {
    uri: REQUEST_PATH + '/alexa/'+userId+'/consumption/now',
    json: true
  };
  const data = await requestPromise(options);

  return data;
};
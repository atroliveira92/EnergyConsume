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
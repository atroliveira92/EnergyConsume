// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  alexaSkill: {
    nlu: 'alexa',
  },
  googleAction: {
    nlu: 'dialogflow',
  },
  stages: {
    local: {
      endpoint: '${JOVO_WEBHOOK_URL}'
    },
    dev: {
      //endpoint: 'arn:aws:lambda:us-east-2:307447280665:function:Energy-Consume'
      endpoint: 'arn:aws:lambda:us-east-1:307447280665:function:ask-nodejs-energy-consume-skill-0eabd37574d3'
    },
    prod: {
      //endpoint: 'arn:aws:lambda:us-east-2:307447280665:function:Energy-Consume'
      endpoint: 'arn:aws:lambda:us-east-1:307447280665:function:ask-nodejs-energy-consume-skill-0eabd37574d3'
    }
  }
};

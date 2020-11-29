// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: true,

  intentMap: {
    'AMAZON.StopIntent': 'END',
    'AMAZON.YesIntent': 'YesIntent',
    'AMAZON.NoIntent': 'NoIntent',
    'AMAZON.HelpIntent': 'HelpIntent',
    'AMAZON.StopIntent': 'StopIntent',
  },

  db: {
    FileDb: {
      pathToFile: '../db/db.json',
    },
  },
};

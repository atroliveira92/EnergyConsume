// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: true,

  intentMap: {
    'AMAZON.StopIntent': 'END',
    'AMAZON.YesIntent': 'YesIntent',
    'AMAZON.NoIntent': 'NoIntent'
  },

  db: {
    FileDb: {
      pathToFile: '../db/db.json',
    },
  },
};

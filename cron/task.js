// Modules
const moment = require('moment');
const CronJob = require('cron').CronJob;
const {setTaskHandler} = require('../controllers/clockify');
const {nofitySlack} = require('../services/slack');

module.exports._task = new CronJob(
  '0 28 23 * * *',
  async () => {
    try {
      let date = moment().format('YYYY-MM-DD');
      await setTaskHandler(date, date);
      await nofitySlack(false, `Clockify task added for date ${date}`);
    } catch (err) {
      await nofitySlack(true, err.message);
    }
  },
  null,
  true,
  'Asia/Kolkata'
);

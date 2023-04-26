// Modules
const moment = require('moment');
const CronJob = require('cron').CronJob;
const {setTaskHandler} = require('../controllers/clockify');

module.exports._task = new CronJob(
  '0 0 20 * * *',
  async () => {
    let date = moment().format('YYYY-MM-DD');
    await setTaskHandler(date, date);
  },
  null,
  true,
  'Asia/Kolkata'
);

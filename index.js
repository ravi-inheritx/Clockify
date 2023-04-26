require('dotenv').config();
const express = require('express');
const bodyParse = require('body-parser');
const cors = require('cors');
const app = express();
const cron = require('./cron/task');
const {nofitySlack} = require('./services/slack');

app.use(bodyParse.json());
app.use(bodyParse.urlencoded({extended: true}));
app.use(cors());

app.use('/api/clockify', require('./routes/clockify'));

app.listen(5000, async() => {
  console.log('app is running ');
  cron._task.start();
  await nofitySlack(true, `Clockify task added for date`);
});

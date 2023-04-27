// Modules
const {default: axios} = require('axios');
const moment = require('moment');
const {nofitySlack} = require('../services/slack');

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @author [Ravi]
 * @methos GET [/clockify]
 */
exports.setActivities = async (req, res, next) => {
  try {
    let start_date = req.query.start_date || moment().format('YYYY-MM-DD');
    let end_date = req.query.end_date || moment().format('YYYY-MM-DD');

    await this.setTaskHandler(start_date, end_date);

    await nofitySlack(false, `Clockify task added for date ${date}`);

    return res.status(200).send({success: true});
  } catch (err) {
    console.log(err);
    await nofitySlack(true, err.message);
    res.status(500).send({success: false});
  }
};

exports.setTaskHandler = async (start_date, end_date) => {
  let top_tracker_token = await topTrackerLogin();

  console.log('tracker login done', top_tracker_token);
  let clockify_token = await clockifyLogin();

  console.log('clockify login done', clockify_token);
  let tasks = await getTopTrackerTask(start_date, end_date, top_tracker_token);

  console.log('got top tracker tasks');
  let organized_tasks = organizeTask(tasks);

  console.log('organized top tracker tasks', organized_tasks);
  await setClockifyTask(organized_tasks, clockify_token);
};

topTrackerLogin = async () => {
  let data = {
    email: process.env.TOP_TRACKER_EMAIL,
    password: 'EdN|#e=&\\fl9>BL' || process.env.TOP_TRACKER_PASSWORD,
    remember_me: true,
  };
  console.log(data);
  let response = await axios.post(
    'https://tracker-api.toptal.com/sessions',
    data
  );
  return response.data.access_token;
};

clockifyLogin = async () => {
  let data = {
    email: process.env.CLOCKIFY_EMAIL,
    password: 'EdN|#e=&\\fl9>BL' || process.env.CLOCKIFY_PASSWORD,
  };
  let response = await axios.post(
    'https://global.api.clockify.me/auth/token',
    data
  );
  return response.data.token;
};

getTopTrackerTask = async (start_date, end_date, token) => {
  let response = await axios.get(
    `https://tracker-api.toptal.com/activities/my?project_ids[]=${+process.env
      .TOP_TRACKER_PROJECT_ID}&start_date=${start_date}&end_date=${end_date}&access_token=${token}`,
    {headers: {'Accept-Encoding': 'gzip,deflate,compress'}}
  );
  return response.data.dates.reverse();
};

setClockifyTask = async (tasks, token) => {
  let promises = [];
  for (let task of tasks) {
    promises.push(
      axios.post(
        'https://global.api.clockify.me/workspaces/5c4ab4edb079873e19eac62b/timeEntries/full',
        task,
        {headers: {'x-auth-token': token}}
      )
    );
  }

  await Promise.all([...promises]);
};

organizeTask = (tasks) => {
  let clockifyTasks = [];

  for (let task of tasks) {
    let taskObj = {
      taskId: process.env.CLOCKIFY_BILLABLE_TASK_ID,
      projectId: process.env.CLOCKIFY_PROJECT_ID,
      billable: true,
    };

    let total_hours = 0;

    for (let activity of task.activities) {
      let start = moment(activity.start_time).set({seconds: 0});
      let end = moment(activity.end_time).set({seconds: 0});
      let hour = moment.duration(end.diff(start)).asHours();
      hour = getTwoDecimalPoint(hour);
      if (total_hours >= 8) {
        continue;
      }
      if (total_hours + hour > 8) {
        let diff = +(8 - total_hours).toFixed(2);
        end = moment(activity.start_time).set({seconds: 0}).add(diff, 'hours');
        console.log(end);
        total_hours = 8;
      } else {
        total_hours += hour;
      }

      taskObj.start = start.set({seconds: 0}).toDate();
      taskObj.end = end.set({seconds: 0}).toDate();
      taskObj.description = activity.description;

      if (activity.description.toLowerCase().includes('client call')) {
        taskObj.taskId = process.env.CLOCKIFY_CLIENT_CALL_TASK_ID;
      } else if (activity.description.toLowerCase().includes('daily scrum')) {
        taskObj.taskId = process.env.CLOCKIFY_SCRUM_TASK_ID;
      } else {
        taskObj.taskId = process.env.CLOCKIFY_BILLABLE_TASK_ID;
      }

      clockifyTasks.push({...taskObj});
    }
  }
  return clockifyTasks;
};

getTwoDecimalPoint = (value) => {
  value = value.toString();
  return +value.slice(0, value.indexOf('.') + 2 + 1);
};

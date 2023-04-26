const {default: axios} = require('axios');

exports.nofitySlack = async (err, msg) => {
  let message = {
    text: 'Clockify Message',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: err ? 'FAILED' : 'SUCCESS',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: msg,
        },
      },
    ],
  };
  await axios.post(
    'https://hooks.slack.com/services/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',
    message,
    {headers: {'Content-Type': 'application/json'}}
  );
};

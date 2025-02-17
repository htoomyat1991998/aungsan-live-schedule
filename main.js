const { default: axios } = require('axios');
const { schedule } = require ('node-cron');
const { exec } = require('shelljs');
const { getVideo, updateVideo, pushChanges } = require('./src/getVideoInfo');
const getFBVideo = require('./src/getFBVideo');
const createLiveStream = require('./src/createLiveStream');
const broadcastLiveStream = require('./src/broadcastLiveStream');

const LIVE_STREAM_TITLE = 'တရား‌‌ေတာ်';
const CRON_SCHEDULE_TIME = process.argv[3];
const FACEBOOK_PAGE_TOKEN = process.argv[2] || process.env.FACEBOOK_PAGE_TOKEN;

!async function () {
  let filePath, fileName, command;
  now('STARTED');

  const video = getVideo();
  const id = video.link.split('/').pop();
  const duration = video.length;

  const { data: currentAuth } = await axios.get(`https://graph.facebook.com/v10.0/me?access_token=${FACEBOOK_PAGE_TOKEN}`);
  console.log('[AUTH]', currentAuth);

  const sources = await getFBVideo(id);
  const { source, text } = sources.filter(source => !(source.text || '').includes('Audio')).pop();

  fileName = new URL(source).pathname.split('/').pop();
  filePath = `${__dirname}/tmp/${fileName}`;

  console.log('[INPUT]', text);
  console.log('[DOWNLOADING]', filePath);

  command = `curl -L '${source}' -o '${filePath}' --progress-bar`;
  exec(command);

  console.log('[CRON]', CRON_SCHEDULE_TIME);
  schedule(CRON_SCHEDULE_TIME, () => onAir(), {
    timezone: 'Asia/Rangoon',
  });

  async function onAir() {
    now('ONAIR');

    const description =  (video.title || LIVE_STREAM_TITLE).split('ago')[0].slice(0, -5);
    const { id, stream_url } = await createLiveStream({
      title: LIVE_STREAM_TITLE,
      description,
      access_token: FACEBOOK_PAGE_TOKEN,
    });

    updateVideo();
    pushChanges();

    command = broadcastLiveStream(filePath, stream_url);
    exec(command);

    setTimeout(() => console.log('[EXIT]') | process.exit(0), 10000);
  }

}().catch(err => console.error('[ERROR]', err));

function now(message) {
  let date = new Date();
  let opt = {
    timeZone: 'Asia/Yangon'
  };
  console.log('[' + message + ']', date.toLocaleString('en-US', opt));
}

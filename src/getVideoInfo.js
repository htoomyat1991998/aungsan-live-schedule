const { resolve } = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { exec } = require('shelljs');

const VIDEO_DATA = resolve(__dirname, '../data/videos.json');
const DATABASE_PATH = resolve(__dirname, '../.db');

function readJSON(path) {
  let text = readFileSync(path, 'utf-8');
  return JSON.parse(text);
}

function readDB() {
  return readJSON(DATABASE_PATH);
}

function readData() {
  return readJSON (VIDEO_DATA);
}

function getVideo() {
  let { index } = readDB();
  let videos = readData();
  let video = videos[index];
  if (video === undefined) {
    throw new Error('Undefined index [' + index + '] in variable $videos');
  }
  video.index = index;
  return video;
}

function updateVideo() {
  let video = getVideo();
  let data = readDB();
  let log = {
    index: video.index,
    title: video.title,
    duration: video.duration,
    link: video.link,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  };
  data.index = video.index + 1;
  data.logs.push(log);
  writeFileSync(DATABASE_PATH, JSON.stringify(data), "utf-8");
}

function pushChanges(message) {
  let command = [
    "git config user.name 'skmetheloper'",
    "git config user.email 'ethereal97@gmail.com'",
    "git add .db",
    "git commit -m 'Live Schedule'",
    "git push"
  ].join(";\n");

  exec(command);
  console.log('[GIT:PUSH]');
}

module.exports = {
  getVideo,
  updateVideo,
  pushChanges,
};

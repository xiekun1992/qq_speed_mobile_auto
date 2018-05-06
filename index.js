const { entries } = require('./config');
const treasure = require('./src/treasure');
const liveVideo = require('./src/live_video');

Date.prototype.format = function formatDate() {
  const date = this;
  return `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, 0)}-${(date.getDate() + '').padStart(2, 0)} ${(date.getHours() + '').padStart(2, 0)}'${(date.getMinutes() + '').padStart(2, 0)}'${(date.getSeconds() + '').padStart(2, 0)}.${date.getMilliseconds()}`;
}

function main() {
  for (const entry of entries) {
    treasure.start(entry);
    liveVideo.start(entry);
  }
}
// 需要记录日志，包括当前寻宝次数，领取了那些奖励，一共寻了多少次包宝，在几星图
main();
// const childProcess = require('child_process');
require('./src/utils');
const { entries } = require('./config');
const treasure = require('./src/treasure');
const liveVideo = require('./src/live_video');
const sign = require('./src/sign');
const guessCarn = require('./src/guess_car');

Date.prototype.format = function formatDate() {
  const date = this;
  return `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, 0)}-${(date.getDate() + '').padStart(2, 0)} ${(date.getHours() + '').padStart(2, 0)}'${(date.getMinutes() + '').padStart(2, 0)}'${(date.getSeconds() + '').padStart(2, 0)}.${date.getMilliseconds()}`;
}
process.env.show = true;
const delay = 60 * 60 * 1000;
// 每次执行结束后30分钟再次执行
function exec(fn, args) {
  fn(args)
    .then(res => {
      console.log('>>>>>res', res);
      setTimeout(fn.bind(null, args), delay);
    })
    .catch(err => {
      console.log('>>>>>error', err);
      setTimeout(fn.bind(null, args), delay);
    });
}

function main() {
  for (const entry of entries) {
    // exec(sign.start, entry);
    // exec(treasure.start, entry);
    // exec(liveVideo.start, entry);
    // exec(guessCar.start, entry);
  }
}
// 需要记录日志，包括当前寻宝次数，领取了那些奖励，一共寻了多少次包宝，在几星图
main();
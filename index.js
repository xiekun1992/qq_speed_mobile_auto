const { parse } = require('./config');
const { analyze } = require('./src/analyzer');
const {
  sign,
  treasure,
  liveVideo,
  guessCar
} = require('./src/worker');
require('./src/utils');

// 设置程序的根路径
// 设置nightmare的electron窗口是否显示
process.env.show = true;
const workingDir = __dirname;
const delay = 60 * 60 * 1000;
const tokenPath = workingDir + '/token.txt';
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
  analyze({ tokenPath })
    .then(() => parse())
    .then(entries => {
      for (const entry of entries) {
        // exec(sign.start, entry);
        // exec(treasure.start, entry);
        // exec(liveVideo.start, entry);
        exec(guessCar.start, entry);
      }
    });
}
// 需要记录日志，包括当前寻宝次数，领取了那些奖励，一共寻了多少次包宝，在几星图
main();
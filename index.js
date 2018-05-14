const dgram = require('dgram');
const os = require('os');
const { parse } = require('./config');
const { analyze } = require('./src/analyzer');
const {
  sign,
  treasure,
  liveVideo,
  GuessCar
} = require('./src/worker');
require('./src/utils');

// 设置程序的根路径
// 设置nightmare的electron窗口是否显示
process.env.show = true;
const workingDir = __dirname;
const delay = 60 * 60 * 1000;
const tokenPath = workingDir + '/token.txt';
const multicastAddr = '230.185.192.108';
let token;
// 每次执行结束后30分钟再次执行
// function exec(fn, args) {
//   fn(args)
//   .then(res => {
//     console.log('>>>>>res', res);
//     setTimeout(fn.bind(null, args), delay);
//   })
//   .catch(err => {
//     console.log('>>>>>error', err);
//     setTimeout(fn.bind(null, args), delay);
//   });
// }

function main(token) {
  let entries = parse(token);
  for (const entry of entries) {
    // exec(sign.start, entry);
    // exec(treasure.start, entry);
    // exec(liveVideo.start, entry);
    // exec(new GuessCar({}).start, entry);
    new GuessCar({}).start(entry);
  }
}
    // 需要记录日志，包括当前寻宝次数，领取了那些奖励，一共寻了多少次包宝，在几星图
    
    
const server = dgram.createSocket('udp4');
server.bind(9000, '0.0.0.0', () => {
  server.setBroadcast(true);
  server.setMulticastTTL(1);
  server.addMembership(multicastAddr);
});

server.on('message', (message, remote) => {
  console.log(`receive message from: ${remote.address}:${remote.port} - ${message}`);
  switch(message.charAt(0)){
    case '1': 
      if(!token) {
        token = message.split(':').pop();
        main(token);
      };
    break; // 分析器发送的内容
    case '2': break; // 工作器发送的内容
  }
});

if (os.platform().includes('win')) { // windows 平台运行分析器，其他平台运行工作器
  analyze({ tokenPath }).then(token => {
    const timer = setInterval(() => {
      const msg = Buffer.from(`1:${token}`);
      server.send(msg, 0, msg.length, 9001, multicastAddr);
      console.log(`send ${msg} to the wire...`);
    }, 2000);
  });
} 
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const { parse } = require('./config');
const { analyze } = require('./src/analyzer');
const {
  sign,
  treasure,
  liveVideo,
  GuessCar
} = require('./src/worker');
const logger = require('./src/utils/logger');
require('./src/utils/utils');

// 设置程序的根路径
// 设置nightmare的electron窗口是否显示
process.env.show = true;
const workingDir = __dirname;
const delay = 60 * 60 * 1000;
const tokenPath = workingDir + '/token.txt';
const logPath = workingDir + '/logs/log.log';
const multicastAddr = '230.185.192.108';
let token;

logger.setPath(logPath);
// 每次执行结束后30分钟再次执行
function exec(fn, args) {
  fn(args)
  .then(res => {
    logger.showAndLog('>>>>>res', res);
    setTimeout(fn.bind(null, args), delay);
  })
  .catch(err => {
    logger.showAndLog('>>>>>error', err);
    setTimeout(fn.bind(null, args), delay);
  });
}

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
let host = '0.0.0.0';
let aport = 9100; // 分析器端口
let wport = 9101; // 工作器端口
let port = aport;

server.on('message', (message, remote) => {
  logger.showAndLog(`receive message from: ${remote.address}:${remote.port} - ${message}`);

  message = message.toString();
  switch(message.charAt(0)){
    case '1': 
      if(!token) { // 获取token后保存本地一份然后启动任务
        token = message.split(':').pop();
        fs.writeFileSync(tokenPath, token);
        let msg = Buffer.from('2');
        // 告诉分析器停止发送信息
        server.send(msg, 0, msg.length, aport, multicastAddr);
        main(token);
      };
    break; // 分析器发送的内容
    case '2': 
      // 分析器停止发送信息
      clearInterval(timer);
      server.close();
    break; // 工作器发送的内容
  }
});

let timer;
if (os.platform().includes('win')) { // windows 平台运行分析器，其他平台运行工作器
  analyze({ tokenPath }).then(token => {
    timer = setInterval(() => {
      const msg = Buffer.from(`1:${token}`);
      server.send(msg, 0, msg.length, wport, multicastAddr);
      logger.showAndLog(`send ${msg} to the wire...`);
    }, 2000);
  });
} else {
  port = wport
}
server.bind(port, host, () => {
  server.setBroadcast(true);
  server.setMulticastTTL(128);
  server.addMembership(multicastAddr);
});
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const { parse } = require('./config');
const { analyze } = require('./src/analyzer');
const {
  Sign,
  Treasure,
  LiveVideo,
  GuessCar,
  Daoju,
  FunWeekly
} = require('./src/worker');
const logger = require('./src/utils/logger');
const { TaskQueue } = require('./src/utils/TaskQueue');
require('./src/utils/utils');
require('./src/utils/customActions');

// 设置程序的根路径
// 设置nightmare的electron窗口是否显示
process.env.show = false;
process.env.workerDebug = true;

const workingDir = __dirname;
const delay = 60 * 60 * 1000;
const tokenPath = workingDir + '/token.txt';
const logPath = workingDir + '/logs';
const multicastAddr = '230.185.192.108';
let token;
let tasks = [GuessCar, Daoju, Sign, FunWeekly, Treasure, LiveVideo];
// let tasks = [GuessCar, Daoju, Sign, FunWeekly];
// let tasks = [Sign];

const windowWidth = 400, windowHeight = 800;
const proxy = {
  'proxy-server': '120.236.137.65:8060',
  // 'proxy-server': '116.7.8.68:9000',
  // 'proxy-server': '120.78.78.141:8888',
  // 'proxy-server': '27.46.20.71:8888',
  // 'proxy-server': '113.116.125.21:9797',
  // 'proxy-server': '183.62.207.242:32755',
  // 'proxy-server': '183.17.231.78:33110',
  'ignore-certificate-errors': true
}

logger.setPath(logPath);
logger.setTemplate('', '>>>');

function tasksFactory(tasks, entries) {
  let taskQueue = [];
  // console.log(tasks)
  for (const Task of tasks) {
    for (const entry of entries) {
      taskQueue.push(new Task({
        entry,
        x: 0,
        y: 0,
        width: windowWidth,
        height: windowHeight,
        proxy
      }));
    }
  }
  return taskQueue;
}
function main(token) {
  let config = parse(token);
  let entries = config.users;
  let tq = new TaskQueue({
    tasksFactory: tasksFactory.bind(null, tasks, entries),
    maxParallelTasks: config.maxParallelTasks,
    // delay: 600
  }).run();
}
if (!process.env.workerDebug) { // 调试工作器的时候关闭分析器
  const server = dgram.createSocket('udp4');
  let host = '0.0.0.0';
  let aport = 9100; // 分析器端口
  let wport = 9101; // 工作器端口
  let port = aport;

  server.on('message', (message, remote) => {
    logger.info(`receive message from: ${remote.address}:${remote.port} - ${message}`);

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
        // 10秒后关闭
        logger.info('ready to terminate analyzer process in 10s');
        let time = 10;
        setTimeout(() => {
          logger.info(`${time}s left`);
          if (time-- > 0) {
            logger.info('analyzer process has been terminated');
            server.close();
            process.exit(0);
          }
        }, 1000);
      break; // 工作器发送的内容
    }
  });

  let timer;
  if (os.platform().includes('win')) { // windows 平台运行分析器，其他平台运行工作器
    analyze({ tokenPath }).then(token => {
      timer = setInterval(() => {
        const msg = Buffer.from(`1:${token}`);
        server.send(msg, 0, msg.length, wport, multicastAddr);
        logger.info(`send ${msg} to the wire...`);
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
} else {
  main(fs.readFileSync(tokenPath));
}
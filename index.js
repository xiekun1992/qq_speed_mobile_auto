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
  FunWeekly,
  Club
} = require('./src/worker');
const Logger = require('./src/utils/logger');
const { TaskQueue } = require('./src/utils/TaskQueue');
require('./src/utils/utils');
require('./src/utils/customActions');

// 设置程序的根路径
// 设置nightmare的electron窗口是否显示
process.env.show = false;

const workingDir = __dirname;
const delay = 60 * 60 * 1000;
const tokenPath = workingDir + '/token.txt';
const logPath = workingDir + '/logs';
const multicastAddr = '230.185.192.108';
let token;
let tasks = [GuessCar, Daoju, Sign, FunWeekly, Club, LiveVideo];
// let tasks = [GuessCar, Daoju, Sign, FunWeekly];
// let tasks = [Club];
// let tasks = [Treasure];

const windowWidth = 400, windowHeight = 800;
const proxy = false && {
  // 'proxy-server': '120.236.137.65:8060',
  // 'proxy-server': '116.7.8.68:9000',
  // 'proxy-server': '120.78.78.141:8888',
  // 'proxy-server': '27.46.20.71:8888',
  // 'proxy-server': '113.116.125.21:9797',
  // 'proxy-server': '183.62.207.242:32755',
  'proxy-server': '120.92.74.189:3128',
  'ignore-certificate-errors': false
}

const logger = Logger.getInstance();
Logger.setPath(logPath);
Logger.setTemplate('', '>>>');

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
let config = parse(token);
function main(token) {
  config = parse(token);
  let entries = config.users;

  entries.forEach(entry => {
    entry.token = token.toString().trim();
  })

  let tq = new TaskQueue({
    tasksFactory: tasksFactory.bind(null, tasks, entries),
    maxParallelTasks: config.maxParallelTasks,
    // delay: 600
  }).run();
}

let execWorker = false, execAnalyzer = false;
switch(process.argv[2]) {
  case '--all': execAnalyzer = true; execWorker = true;break;
  case '--analysis': execAnalyzer = true;break;
  default: execWorker = true;
}

if (execAnalyzer) { // 调试工作器的时候关闭分析器
  const server = dgram.createSocket('udp4');
  let host = '0.0.0.0';
  let aport = 9100; // 分析器端口
  let wport = 9101; // 工作器端口
  let port = aport;

  server.on('message', (message, remote) => {
    logger.info(`receive message from: ${remote.address}:${remote.port} - ${message}`);

    message = message.toString();
    switch(message.charAt(0)){
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
            if (!execWorker) {
              process.exit(0);
            }
          }
        }, 1000);
      break; // 工作器发送的内容
    }
  });

  let timer;
  if (os.platform().includes('win')) { // windows 平台运行分析器，其他平台运行工作器

    analyze({ 
      tokenPath,
      tsharkPath: config.tsharkPath, 
      nemuPlayerPath: config.nemuPlayerPath
    }).then(token => {
      timer = setInterval(() => {
        const msg = Buffer.from(`1:${token}`);
        server.send(msg, 0, msg.length, wport, multicastAddr);
        logger.info(`send ${msg} to the wire...`);
      }, 2000);
    });
  }
  server.bind(port, host, () => {
    server.setBroadcast(true);
    server.setMulticastTTL(128);
    server.addMembership(multicastAddr);
  });
} 
if (execWorker) {
  if (!execAnalyzer) {
    main(fs.readFileSync(tokenPath));
  } else {
    const server = dgram.createSocket('udp4');
    let host = '0.0.0.0';
    let aport = 9100; // 分析器端口
    let wport = 9101; // 工作器端口
  
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
            let t = setTimeout(function() {
              server.close();
              clearTimeout(t);
            }, 5000);
            main(token);
          };
        break; // 分析器发送的内容
      }
    });
  
    port = wport
    server.bind(port, host, () => {
      server.setBroadcast(true);
      server.setMulticastTTL(128);
      server.addMembership(multicastAddr);
    });
  }
}
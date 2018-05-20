const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const { parse } = require('./config');
const { analyze } = require('./src/analyzer');
const {
  sign,
  treasure,
  liveVideo,
  GuessCar,
  Daoju
} = require('./src/worker');
const logger = require('./src/utils/logger');
require('./src/utils/utils');

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
let tasks = [GuessCar, Daoju];//[Daoju, GuessCar];
let runningTasks = 0;
let maxParallelTasks = 2;
let taskNextPlanSetted = false; // 保证下次任务运行的全局唯一性

logger.setPath(logPath);

function watcher(taskInstance) {
  return taskInstance.start().then((res) => {
    logger.showAndLog(`task finished successfully: ${res}`);
    return res;
  }).catch((err) => {
    logger.showAndLog(`task fail with error: ${err}`);
    return err;
  });
}

function execTask(taskQueue) {
  if (runningTasks < maxParallelTasks) {
    const Tasks = taskQueue.splice(0, maxParallelTasks - runningTasks);

    if (Tasks.length === 0 && !taskNextPlanSetted) { // 所有任务都已经运行完毕，则在固定延迟之后重新运行一遍
      taskNextPlanSetted = true;
      logger.showAndLog(`rerun tasks after ${delay}ms`);
      setTimeout(() => {
        let newToken = token || fs.readFileSync(tokenPath);
        taskNextPlanSetted = false;
        main(newToken);
      }, delay);
      return ;
    }
    for (const Task of Tasks) {
      watcher(Task)
      .then(isclose => {
        console.log(isclose);
        return typeof isclose === 'boolean' && isclose && execTask(taskQueue);
      })
      .catch(isclose => {
        console.log(isclose);
        return typeof isclose === 'boolean' && isclose && execTask(taskQueue);
      });
    }
  }
}

function main(token) {
  let entries = parse(token);
  let taskQueue = [];
  for (const Task of tasks) {
    for (const entry of entries) {
      taskQueue.push(new Task({
        entry
      }));
    }
  }
  // tasks = [sign, treasure, liveVideo, new GuessCar({})];
  execTask(taskQueue);
}
if (!process.env.workerDebug) { // 调试工作器的时候关闭分析器
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
        // 10秒后关闭
        logger.showAndLog('ready to terminate analyzer process in 10s');
        let time = 10;
        setTimeout(() => {
          logger.showAndLog(`${time}s left`);
          if (time-- > 0) {
            logger.showAndLog('analyzer process has been terminated');
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
} else {
  main(fs.readFileSync(tokenPath));
}
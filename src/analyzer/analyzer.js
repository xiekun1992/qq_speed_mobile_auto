const { spawn, exec } = require('child_process');
const querystring = require('querystring');
const path = require('path');
const logger = require('../utils/logger').getInstance();


function kill(pid) {
  exec(`taskkill /PID ${pid} /F /T`, (err, stdout, stderr) => {
    if (err) {
      logger.error(err); 
      throw err;
    }
    logger.info(stdout);
    logger.error(stderr);
  });
}
function killNemu() {
  exec(`taskkill /IM NemuBooter.exe /IM NemuPlayer.exe /IM NemuSVC.exe /IM NemuHeadless.exe /F /T`, (err, stdout, stderr) => {
    if (err) {
      logger.error(err); 
      // throw err;
    }
    logger.info(stdout);
    logger.error(stderr);
  });
}

function analyze ({tokenPath, tsharkPath, nemuPlayerPath}) {
  if (!tsharkPath) {
    throw new Error('can not find tshark.exe, please specify tshark path in config.json');
  }
  if (!nemuPlayerPath) {
    throw new Error('can not find NemuPlayer.exe, please specify NemuPlayer path in config.json');
  }
  return new Promise((resolve, reject) => {
    const mu = spawn(path.resolve(nemuPlayerPath, 'NemuPlayer.exe'), []);
    mu.stderr.on('data', data => {
      logger.info(`nemu player error due to: ${data}`);
    });
    mu.on('close', (code, signal) => {
      logger.info(`nemu player exited with code ${code}, signal ${signal}`);
    });
    
    const ws = spawn(path.resolve(tsharkPath, 'tshark.exe'), ['-i', 'WLAN', '-w', '-', 'port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420']);
    ws.stdout.on('data', data => {
      data = data.toString();
      console.log(data)
      if (/\/php_cgi\/plive\/speed\/html\/index\.html/g.test(data)) {
        // console.log(mu.pid)
        ws.kill();
        // killNemu();
        // mu.kill();
    
        let res = /\/php_cgi\/plive\/speed\/html\/index\.html?(\S+)/g.exec(data);
        if (res && res.length > 0) {
          let queries = res.pop();
          let params = querystring.parse(queries);
          resolve(params.token);
        }
      }
    });
    ws.stderr.on('data', data => {
      logger.error(`wireshark error due to: ${data}`);
    });
    ws.on('close', (code, signal) => {
      // mu.kill();
      killNemu();
      logger.info(`wireshark exited with code ${code}, signal ${signal}`);
    });
  });
}

exports.analyze = analyze;
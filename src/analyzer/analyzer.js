const { spawn, exec } = require('child_process');
const querystring = require('querystring');
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

function analyze () {
    return new Promise((resolve, reject) => {
        const mu = spawn('D:\\Program Files (x86)\\MuMu\\emulator\\nemu\\EmulatorShell\\NemuPlayer.exe', []);
        mu.stderr.on('data', data => {
          logger.info(`nemu player error due to: ${data}`);
        });
        mu.on('close', (code, signal) => {
          logger.info(`nemu player exited with code ${code}, signal ${signal}`);
        });
        
        const ws = spawn('D:\\Program Files\\Wireshark\\tshark.exe', ['-i', 'WLAN', '-w', '-', 'port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420']);
        ws.stdout.on('data', data => {
          data = data.toString();
          // console.log(data)
          if (/\/app\/actcenter\/index\/speed\/1/g.test(data)) {
            // console.log(mu.pid)
            ws.kill();
            // killNemu();
            // mu.kill();
        
            let res = /\/app\/actcenter\/index\/speed\/1\?(\S+)/g.exec(data);
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
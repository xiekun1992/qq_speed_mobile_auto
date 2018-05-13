const { spawn } = require('child_process');
const querystring = require('querystring');

function analyze () {
    return new Promise((resolve, reject) => {
        const mu = spawn('D:\\Program Files (x86)\\MuMu\\emulator\\nemu\\EmulatorShell\\NemuPlayer.exe', []);
        mu.stderr.on('data', data => {
            reject(`nemu player error due to: ${data}`);
        });
        mu.on('close', code => {
            console.log(`nemu player exited with code ${code}`);
        });
        
        const ws = spawn('D:\\Program Files\\Wireshark\\tshark.exe', ['-i', 'WLAN', '-w', '-', 'port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420']);
        ws.stdout.on('data', data => {
          data = data.toString();
          console.log(data)
          if (/\/app\/actcenter\/index\/speed\/1/g.test(data)) {
            ws.kill();
            mu.kill();
        
            let res = /\/app\/actcenter\/index\/speed\/1\?(\S+)/g.exec(data);
            if (res && res.length > 0) {
              let queries = res.pop();
              let params = querystring.parse(queries);
              resolve(params.token);
            }
          }
        });
        ws.stderr.on('data', data => {
          console.log(`wireshark error due to: ${data}`);
        });
        ws.on('close', code => {
          mu.kill();
          console.log(`wireshark exited with code ${code}`);
        });
    });
}

exports.analyze = analyze;
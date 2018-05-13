const { spawn } = require('child_process');
const querystring = require('querystring');

function analyze () {
    return new Promise((resolve, reject) => {
        const mu = spawn('D:\\Program Files (x86)\\MuMu\\emulator\\nemu\\EmulatorShell\\NemuPlayer.exe', []);
        // mu.stdout.on('data', data => {
        //   console.log(`nemu player: ${data}`);
        // });
        mu.stderr.on('data', data => {
            reject(`nemu player error due to: ${data}`);
        });
        mu.on('close', code => {
            console.log(`nemu player exited with code ${code}`);
        });
        
        const ws = spawn('D:\\Program Files\\Wireshark\\Wireshark.exe', [/*'-Y', 'http.request.uri.path == \"/app/actcenter/index/speed/1\"',*/ '-i', 'WLAN', '-k', '-w', '-']);
        ws.stdout.on('data', data => {
          if (/\/app\/actcenter\/index\/speed\/1/g.test(data)) {
            ws.kill();
        
            let res = /\/app\/actcenter\/index\/speed\/1\?(\S+)/g.exec(data);
            if (res && res.length > 0) {
              let queries = res.pop();
              let params = querystring.parse(queries);
              resolve(params.token);
            }
          }
        });
        ws.stderr.on('data', data => {
          reject(`wireshark error due to: ${data}`);
        });
        ws.on('close', code => {
          console.log(`wireshark exited with code ${code}`);
        });
    });
}

exports.analyze = analyze;
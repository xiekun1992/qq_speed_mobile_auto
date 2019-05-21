var https = require("https");
var boundary = '------WebKitFormBoundary7MA4YWxkTrZu0gW'
var boundaryEnd = '------WebKitFormBoundary7MA4YWxkTrZu0gW--'
// var token = 'vYGkr42s' 

// var account = '840914927'
// var account = '2195619068'

// var options = {
//     "method": "POST",
//     "port": 443,
//     "hostname": "bang.qq.com",
//     // "path": "/app/speed/treasure/ajax/startDigTreasure",
//     "headers": {
//         "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
//         "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
//         "Origin": "https://bang.qq.com",
//         "Referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=buPK5zwB&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
//         "cache-control": "no-cache",
//         "Postman-Token": "62bc9d66-fdf0-474f-b8eb-863bfa3cd02f"
//     }
// };

function formData(obj) {
  var str = '';
  for (var k in obj) {
    str += `${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${obj[k]}\r\n`
  }
  return str + boundaryEnd;
}
function parseResult(text) {
  let res
  try {
    res = JSON.parse(text)
  } catch(e) {
    res = {}
  }
  return res;
}


function startDigTreasure(account, token) {
    var options = {
        "method": "POST",
        "port": 443,
        "hostname": "bang.qq.com",
        "path": "/app/speed/treasure/ajax/startDigTreasure",
        "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
            "Origin": "https://bang.qq.com",
            "Referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=buPK5zwB&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
            "cache-control": "no-cache",
            "Postman-Token": "62bc9d66-fdf0-474f-b8eb-863bfa3cd02f"
        }
    };
//   options["path"] = "/app/speed/treasure/ajax/startDigTreasure"
  return new Promise((resolve, reject) => {
    var req = https.request(options, function (res) {
      var chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
    
      res.on("end", function () {
        var body = Buffer.concat(chunks);
        var res = parseResult(body.toString());
        resolve(res)
      });
    });
    req.on('error', reject)
    
    req.write(formData({
      game: 'speed',
      mapId: '14',
      starId: '4',
      type: '1',
      serverId: '0',
      areaId: '1',
      roleId: account,
      userId: '75507990',
      appOpenid: '',
      uin: account,
      token: token,
    }));
    req.end();
  });
}


function endDigTreasure(account, token) {
    var options = {
      "method": "POST",
      "port": 443,
      "hostname": "bang.qq.com",
      "path": "/app/speed/treasure/ajax/endDigTreasure",
      "headers": {
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        "origin": "https://bang.qq.com",
        "referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=vYGkr42s&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
        "cache-control": "no-cache",
        "Postman-Token": "ce848951-4452-4f02-9998-4cafbdb06b56"
      }
    };
//   options["path"] = "/app/speed/treasure/ajax/endDigTreasure"
  return new Promise((resolve, reject) => {
    var req = https.request(options, function (res) {
      var chunks = [];
    
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
    
      res.on("end", function () {
        var body = Buffer.concat(chunks);
        var res = parseResult(body.toString());
        resolve(res)
      });
    });
    req.on('error', reject)
    
    req.write(formData({
      game: 'speed',
      mapId: '14',
      starId: '4',
      type: '1',
      serverId: '0',
      areaId: '1',
      roleId: account,
      userId: '75507990',
      appOpenid: '',
      uin: account,
      token: token,
    }));
    req.end();
  })
}

module.exports = {
  start: startDigTreasure,
  end: endDigTreasure
}
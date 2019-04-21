const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');
const http = require('http');

// 自动每日寻宝
exports.Treasure = class Treasure {
  constructor({show = process.env.show, entry, x, y, width, height, proxy}) {
    const option = {
      alwaysOnTop: false,
      show, x, y, width, height
    };
    if (proxy) {
      option.switches = proxy;
    }
    this.nm = new Nightmare(option);
    this.entry = entry;
    this.logger = logFactory.getInstance();
    this.logger.setTemplate(this.constructor.name, this.entry.account);
  }
  checkLeftTimes() {
    this.logger.info(`check left times`);
    // 领取上次寻宝的奖励，如果显示了的话
    this.nm
      .visible('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
      .then(isvisible => {
        if (isvisible) {
          return this.nm
            .wait(1000)
            .screenshot(`./screen_shots/${new Date().format()}.png`) // 记录奖励
            .wait(1000)
            .click('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
        }
      })
    return this.nm
      .wait('#leftTimes')
      .wait(3000)
      .number('#leftTimes')
      .then(times => {
        this.logger.info(`times left: ${times}`);
        if (times > 0) {
          return this.huntTreasure();
        } else {
          this.logger.info(`times used up: ${times}`);
          return this.nm.end().then(() => {
            this.logger.info(`app close`);
            return true;
          });
        }
      });
  }
  huntTreasure() {
    this.logger.info(`hunt treasure`);
    let waitTimeout = this.nm.options.waitTimeout;
    this.nm.options.waitTimeout = 1000 * 60 * 20;
    return this.nm
      .wait('#application > div.tabs > ul')
      .clickLast('#application > div.tabs > ul > li:not(.suo)')
      // 进入寻宝
      .wait('#application > div.tabs > div.tabs-bd > div.ditu-warp>ul:not(.hideClassName) > li div.tit-flog')
      .wait(1000)
      .click('#application > div.tabs > div.tabs-bd > div.ditu-warp>ul:not(.hideClassName) > li div.tit-flog') // 选择今日大吉的地图
      .wait('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)')
      .wait(1000)
      .click('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)') // 选择普通寻宝
      .wait('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
      .wait(1000)
      .screenshot(`./screen_shots/${new Date().format()}.png`) // 记录奖励
      .wait(1000)
      .click('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow') // 开始寻宝
      // 等待寻宝完成
      .wait(1.01 * 10 * 60 * 1000)
      // 领取奖励
      .wait('#result_show')
      .screenshot(`./screen_shots/${new Date().format()}.png`)
      .click('#result_show > div > div.btn-box > a')
      .then(() => {
        this.nm.options.waitTimeout = waitTimeout;
        this.logger.info(`treasure hunt finished`);
        return this.checkLeftTimes();
      }).catch(err => {
        this.logger.error(`${err}`);
        return this.nm.end().then(() => {
          this.logger.info(`app close`);
          return true;
        });
      });
  }
  start1() {
    this.logger.info(`start`);
    return this.nm
      .viewport(400, 800)
      .goto(this.entry.treasure_url)
      // .waitUntilVisible('#u') // account
      // .type('#u', this.entry.account)
      // .waitUntilVisible('#p') // password
      // .type('#p', this.entry.password)
      // .waitUntilVisible('#go') // login button
      // .click('#go')
      .wait(2000)
      .waitUntilVisible('#application > div.tabs > ul')
      .visible('#treasurenormal_popbox') // 检测当前是否在寻宝
      .then(res => {
        this.logger.info(`is treasure hunting? ${res}`);
        if (res) {
          return this.checkLeftTimes();
        } else {
          return this.nm
            .wait('#dig_tip_container')
            .then(res => {
              return this.checkLeftTimes();
            });
        }
      }).catch(err => {
        this.logger.error(`${err}`);
        return this.nm.end().then(() => {
          this.logger.info(`app close`);
          return true;
        });
      });
  }
  request() {
    return new Promise((resolve, reject) => {

      if (this.entry.account.startsWith('8')) {
        var options = {
          "method": "POST",
          "hostname": [
            "bang",
            "qq",
            "com"
          ],
          "path": [
            "app",
            "speed",
            "treasure",
            "ajax",
            "startDigTreasure"
          ],
          "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
            "Origin": "https://bang.qq.com",
            "Referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=buPK5zwB&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
            "cache-control": "no-cache",
            "Postman-Token": "54a5c96e-07a1-42be-9f29-3b3c059a3a05"
          }
        };
        
        var req = http.request(options, function (res) {
          var chunks = [];
        
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
        
          res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            resolve(body.toString());
          });
          res.on('error', (e) => {
            reject(e);
          });
        });
        
        req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"game\"\r\n\r\nspeed\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"mapId\"\r\n\r\n14\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"starId\"\r\n\r\n4\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"serverId\"\r\n\r\n0\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"areaId\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"roleId\"\r\n\r\n840914927\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"userId\"\r\n\r\n75507990\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"appOpenid\"\r\n\r\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"uin\"\r\n\r\n840914927\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"token\"\r\n\r\nvYGkr42s\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
        req.end();
      } else {
        var options = {
          "method": "POST",
          "hostname": [
            "bang",
            "qq",
            "com"
          ],
          "path": [
            "app",
            "speed",
            "treasure",
            "ajax",
            "startDigTreasure"
          ],
          "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
            "Origin": "https://bang.qq.com",
            "Referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=buPK5zwB&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
            "cache-control": "no-cache",
            "Postman-Token": "018de726-2512-473e-8194-63efff5d77f7"
          }
        };
        
        var req = http.request(options, function (res) {
          var chunks = [];
        
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
        
          res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            resolve(body.toString());
          });
          res.on('error', (e) => {
            reject(e);
          });
        });
        
        req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"game\"\r\n\r\nspeed\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"mapId\"\r\n\r\n14\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"starId\"\r\n\r\n4\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"serverId\"\r\n\r\n0\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"areaId\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"roleId\"\r\n\r\n2195619068\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"userId\"\r\n\r\n75507990\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"appOpenid\"\r\n\r\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"uin\"\r\n\r\n2195619068\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"token\"\r\n\r\nvYGkr42s\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
        req.end();
      }
    });
  }
  finish() {
    return new Promise((resolve, reject) => {

      if (this.entry.account.startsWith('8')) {
        var options = {
          "method": "POST",
          "hostname": [
            "bang",
            "qq",
            "com"
          ],
          "path": [
            "app",
            "speed",
            "treasure",
            "ajax",
            "endDigTreasure"
          ],
          "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "origin": "https://bang.qq.com",
            "referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=vYGkr42s&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
            "cache-control": "no-cache",
            "Postman-Token": "c163d6b8-60f7-444c-a52c-d93ca32adda1"
          }
        };
        
        var req = http.request(options, function (res) {
          var chunks = [];
        
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
        
          res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            resolve(body.toString());
          });
          res.on('error', (e) => {
            reject(e);
          });
        });
        
        req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"game\"\r\n\r\nspeed\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"mapId\"\r\n\r\n14\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"starId\"\r\n\r\n4\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"serverId\"\r\n\r\n0\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"areaId\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"roleId\"\r\n\r\n840914927\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"userId\"\r\n\r\n75507990\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"appOpenid\"\r\n\r\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"uin\"\r\n\r\n840914927\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"token\"\r\n\r\nvYGkr42s\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
        req.end();
      } else {
        var options = {
          "method": "POST",
          "hostname": [
            "bang",
            "qq",
            "com"
          ],
          "path": [
            "app",
            "speed",
            "treasure",
            "ajax",
            "endDigTreasure"
          ],
          "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "origin": "https://bang.qq.com",
            "referer": "https://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6%E7%BA%B8%E9%83%BD&uin=840914927&uniqueRoleId=167249511&token=vYGkr42s&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=147&toUin=840914927&",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Electron/1.8.6 Safari/537.36",
            "cache-control": "no-cache",
            "Postman-Token": "8af04bd9-d710-420d-b38b-7fb966bfec23"
          }
        };
        
        var req = http.request(options, function (res) {
          var chunks = [];
        
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
        
          res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            resolve(body.toString());
          });
          res.on('error', (e) => {
            reject(e);
          });
        });
        
        req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"game\"\r\n\r\nspeed\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"mapId\"\r\n\r\n14\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"starId\"\r\n\r\n4\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"serverId\"\r\n\r\n0\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"areaId\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"roleId\"\r\n\r\n2195619068\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"userId\"\r\n\r\n75507990\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"appOpenid\"\r\n\r\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"uin\"\r\n\r\n2195619068\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"token\"\r\n\r\nvYGkr42s\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
        req.end();
      }
    });
  }
  turn() {
    return this.request().then(result => {
      let data = JSON.parse(result);
      if (data.res == 0) {
        return this.nm
        // 等待寻宝完成
        .wait(1.01 * 10 * 60 * 1000)
        .then(() => {
          return this.finish().then(result => {
            let data = JSON.parse(result);
            if (data.res == 0 && data.todayTimes < data.todaycanTimes) {
              return this.turn();
            } else {
              return true;
            }
          }).catch(() => {
            this.logger.info(`finish fail: ${e}`);
            return true;
          });
        }).catch(() => {
          this.logger.info(`wait fail: ${e}`);
          return true;
        });
      }
    }).catch(() => {
      this.logger.info(`request fail: ${e}`);
      return true;
    });
  }
  start() {
    this.logger.info(`start`);
    return this.nm
      .viewport(400, 800)
      .goto(this.entry.treasure_url)
      .then(res => {
        return this.turn();
      }).catch(err => {
        this.logger.error(`${err}`);
        return this.nm.end().then(() => {
          this.logger.info(`app close`);
          return true;
        });
      });
  }
}
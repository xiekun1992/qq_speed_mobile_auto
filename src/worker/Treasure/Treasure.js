const Nightmare = require('nightmare');
const logFactory = require('../../utils/logger');
const httpRequest = require('./httpRequest');
console.log(httpRequest)
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
  request() {
    console.log(this.entry.account, this.entry.token)
    return httpRequest.start(this.entry.account, this.entry.token)
  }
  finish() {
    return httpRequest.end(this.entry.account, this.entry.token)
  }
  turn() {
    this.logger.info(`start turn`)
    return this.request().then(data => {
      this.logger.info(`start treasure request send: ${JSON.stringify(data)}`)
      if (data.res == 0) {
        this.logger.info(`start treasure success`)
        let stime = new Date(data.data.time)
        let etime = stime.getTime() + 10*60*1000
        let interval = etime - Date.now()
        this.logger.info(`wait milliseconds: ${interval}`)
        return this.nm
        // 等待寻宝完成
        .wait(interval)
        .then(() => {
          return this.finish().then(data => {
            this.logger.info(`end treasure request send`)
            if (data.res == 0 && data.todayTimes < data.todaycanTimes) {
              this.logger.info(`end treasure success, next turn`)
              return this.turn();
            } else {
              return this.nm.end().then(() => {
                this.logger.info(`app close`);
                return true;
              });
            }
          })
        })
      } else {
        return this.nm.end().then(() => {
          this.logger.info(`app close`);
          return true;
        });
      }
    }).catch((e) => {
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
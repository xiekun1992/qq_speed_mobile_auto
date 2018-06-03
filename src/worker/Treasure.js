const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');

// 自动每日寻宝
exports.Treasure = class Treasure {
  constructor({show = process.env.show, entry, x, y, width, height}) {
    this.nm = new Nightmare({
      show,
      waitTimeout: 1000 * 60 * 20, x, y, width, height
    });
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
        this.logger.info(`treasure hunt finished`);
        return this.checkLeftTimes();
      });
  }
  start() {
    this.logger.info(`start`);
    return this.nm
      .viewport(400, 800)
      .goto(this.entry.treasure_url)
      .waitUntilVisible('#u') // account
      .type('#u', this.entry.account)
      .waitUntilVisible('#p') // password
      .type('#p', this.entry.password)
      .waitUntilVisible('#go') // login button
      .click('#go')
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
}
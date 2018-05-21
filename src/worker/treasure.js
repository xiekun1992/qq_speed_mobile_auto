const Nightmare = require('nightmare');
const logger = require('../utils/logger');

// 自动每日寻宝
exports.Treasure = class Treasure {
  constructor({show = process.env.show, entry}) {
    this.nm = new Nightmare({
      show,
      waitTimeout: 1000 * 60 * 20
    });
    this.entry = entry;
    this.name = this.constructor.name;
  }
  checkLeftTimes() {
    logger.showAndLog(`${this.name} >>> check left times`);
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
        if (times > 0) {
          return this.huntTreasure();
        } else {
          logger.showAndLog(`${this.name} >>> times used up: ${times}`);
          return this.nm.end().then(() => {
            logger.showAndLog(`${this.name} >>> app close`);
            return true;
          });
        }
      });
  }
  huntTreasure() {
    logger.showAndLog(`${this.name} >>> hunt treasure`);
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
      .then((res) => {
        logger.showAndLog(`${this.name} >>> ${res}`);
        return this.checkLeftTimes();
      });
  }
  start() {
    logger.showAndLog(`${this.name} >>> start`);
    return this.nm
      .goto(this.entry.treasure_url)
      .wait('#u') // account
      .type('#u', this.entry.account)
      .wait('#p') // password
      .type('#p', this.entry.password)
      .wait('#go') // login button
      .click('#go')
      .wait('#application > div.tabs > ul')
      .visible('#treasurenormal_popbox') // 检测当前是否在寻宝
      .then(res => {
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
        logger.showAndLog(`${this.name} >>> ${err}`);
        return this.nm.end().then(() => {
          logger.showAndLog(`${this.name} >>> app close`);
          return true;
        });
      });
  }
}
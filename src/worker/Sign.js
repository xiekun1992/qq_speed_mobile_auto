const Nightmare = require('nightmare');
const logger = require('../utils/logger');

exports.Sign = class Sign {
  constructor({show = process.env.show, entry}) {
    this.nm = new Nightmare({
        show,
        waitTimeout: 10000
    });
    this.entry = entry;
    this.name = this.constructor.name;
    this.retryLimit = 20;
    this.retriedTimes = 0;
  }
  retry(action) {
    if (this.retriedTimes < this.retryLimit) {
      this.retriedTimes++;
      action.call(this);
    } else {
      this.nm.end().then(() => {
        logger.showAndLog(`${this.name} >>> retry ${this.retryLimit} times, ${action.name}() still error`);
        return true;
      });
    }
  }
  start() {
    return this.nm
      .cookies.clearAll()
      .goto(this.entry.sign_url)
      .waitUntilVisible('#signButton')
      .hasClass('#signButton', 'btn_sign')
      .then(canSign => {
        if (canSign) {
          logger.showAndLog(`${this.name} >>> can sign`);
          return this.nm
            .click('#signButton')
            .waitUntilVisible('body > div.bang-dialog-dialog')
            .waitUntilVisible('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
            .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
            .wait(1000)
            .then(() => {
              return this.signWeek();
            }).catch(err => {
              logger.showAndLog(`${this.name} >>> ${err}`);
              logger.showAndLog(`${this.name} >>> sign day error, retry`);
              // this.start();
              this.retry(this.start);
            })
        } else {
          return this.signWeek();
        }
      }).catch(err => {
        logger.showAndLog(`${this.name} >>> ${err}`);
        logger.showAndLog(`${this.name} >>> sign day error, retry`);
        // this.start();
        this.retry(this.start);
      })
  }
  signWeek() {
    return this.nm
      .touch('#giftTab > div.hd > ul > li:nth-child(2)') // 切换到每周签到
      .wait(1000)
      .evaluate(selector => {
        return !!document.querySelector(selector);
      }, '#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
      .then(canReceive => {
        if (canReceive) { // 还没有完成每周签到
          return this.nm
            .click('#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
            .wait(3000)
            .visible('body > div.bang-dialog-dialog')
            .then(isvisible => {
              if (isvisible) {
               return this.nm
                  .wait('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                  .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                  .wait(1000)
                  .end()
                  .then(() => {
                    logger.showAndLog(`${this.name} >>> sign success, app close`);
                    return this.nm
                      .end()
                      .then(() => {
                        return true;
                      })
                  }).catch(err => {
                    logger.showAndLog(`${this.name} >>> ${err}`);
                    this.nm.refresh();
                    return this.signWeek();
                  });
              } else {
                this.nm.refresh();
                return this.signWeek();
              }
            }).catch(err => {
              logger.showAndLog(`${this.name} >>> ${err}`);
              this.nm.refresh();
              return this.signWeek();
            });
  
        } else { // 已完成每周签到，自动退出
          return this.nm
            .end()
            .then(() => {
              logger.showAndLog(`${this.name} >>> already signed, app close`);
              return true;
            })
        }
      }).catch(err => {
        logger.showAndLog(`${this.name} >>> ${err}`);
        this.nm.refresh();
        return this.signWeek();
      });
  }
}
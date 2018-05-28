const Nightmare = require('nightmare');
const logger = require('../utils/logger').getInstance();

exports.Sign = class Sign {
  constructor({show = process.env.show, entry}) {
    this.nm = new Nightmare({
        show,
        waitTimeout: 10000
    });
    this.entry = entry;
    logger.setTemplate(this.constructor.name, this.entry.account);
    this.retryLimit = 20;
    this.retriedTimes = 0;
  }
  retry(action) {
    if (this.retriedTimes < this.retryLimit) {
      this.retriedTimes++;
      return action.call(this);
    } else {
      return this.nm.end().then(() => {
        logger.info(`retry ${this.retryLimit} times, ${action.name}() still error`);
        return true;
      });
    }
  }
  start() {
    return this.nm
      .cookies.clearAll()
      .viewport(400, 800)
      .goto(this.entry.sign_url)
      .waitUntilVisible('#signButton')
      .hasClass('#signButton', 'btn_sign')
      .then(canSign => {
        if (canSign) {
          logger.info(`can sign`);
          return this.nm
            .click('#signButton') // 每日签到
            .waitUntilVisible('body > div.bang-dialog-dialog') // 签到弹框
            .waitUntilVisible('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
            .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a') // 隐藏签到弹框
            // .wait(1000)
            .then(() => {
              return this.signMonth().then(this.signWeek.bind(this));
            }).catch(err => {
              logger.error(`${err}`);
              logger.error(`sign day error, retry`);
              // this.start();
              return this.retry(this.start);
            })
        } else {
          return this.signMonth().then(this.signWeek.bind(this));
          // return this.signWeek();
        }
      }).catch(err => {
        logger.error(`${err}`);
        logger.error(`sign day error, retry`);
        // this.start();
        return this.retry(this.start);
      })
  }
  signMonth() { // 一次性领取每月积累的奖励
    logger.info(`signMonth`);
    let date = new Date();
    if (date.getDate() > 25) { // 25号之后每天判断领取奖励
      return this.nm
        .evaluate(async selector => {
          function clickEl(el) {
            return new Promise((resolve, reject) => {
              function checkResult() {
                if (!el.classList.contains('receive')) {
                  resolve('done');
                } else {
                  setTimeout(checkResult, 500);
                }
              }
              el.click();
              checkResult();
            });
          }
          let els = document.querySelectorAll(selector);
          for (let el of els) {
            await clickEl(el);
          }
        }, 'div.prize a.receive')
    }
    return Promise.resolve('not now');
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
                    logger.info(`sign success, app close`);
                    return this.nm
                      .end()
                      .then(() => {
                        return true;
                      })
                  }).catch(err => {
                    logger.info(err);
                    this.nm.refresh();
                    return this.signWeek();
                  });
              } else {
                this.nm.refresh();
                return this.signWeek();
              }
            }).catch(err => {
              logger.error(err);
              this.nm.refresh();
              return this.signWeek();
            });
  
        } else { // 已完成每周签到，自动退出
          return this.nm
            .end()
            .then(() => {
              logger.info(`already signed, app close`);
              return true;
            })
        }
      }).catch(err => {
        logger.error(err);
        this.nm.refresh();
        return this.signWeek();
      });
  }
}
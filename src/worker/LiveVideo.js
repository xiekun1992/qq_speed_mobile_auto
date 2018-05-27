const Nightmare = require('nightmare');
const logger = require('../utils/logger');
const waitTimeout = 1 * 60 * 1000;

exports.LiveVideo = class LiveVideo {
  constructor({show = process.env.show, entry}) {
    this.nm = new Nightmare({
      show,
      pollInterval: 2000,
      waitTimeout
    });
    this.entry = entry;
    this.name = `${this.constructor.name} - ${this.entry.account}`;
  }  
  login() {
    logger.showAndLog(`${this.name} >>> login`);
    return this.nm
      .wait('#dvGift > div > div > div.gin_gift_box > div.gin_hd > div.gin_extra > span > a')
      .click('#dvGift > div > div > div.gin_gift_box > div.gin_hd > div.gin_extra > span > a')
      .wait('#u') // account
      .type('#u', this.entry.account)
      .wait('#p') // password
      .type('#p', this.entry.password)
      .wait('#go') // login button
      .click('#go')
      .then(() => {
        this.showMsgInput(this.checksum);
      }).catch(() => {
        this.nm.refresh();
        this.login();
      });
  }
  checksum() {
    logger.showAndLog(`${this.name} >>> checksum`);
    this.nm.options.waitTimeout = waitTimeout;
    return this.nm
      .wait('#Dvinputmsg > div.extra > div')
      .click('#Dvinputmsg > div.extra > div')
      .wait(2000)
      .wait('#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
      .number('#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.sum')
      .then(sum => {
        logger.showAndLog(`${this.name} >>> flowers: ${sum}`);
        if (sum > 2) {
          return this.nm.end().then(() => {
            logger.showAndLog(`${this.name} >>> app should close`);
            return true;
          });
        } else {
          this.nm.evaluate(selector => {
            let time = document.querySelectorAll(selector)[0].innerText.split(':');
            let leftSeconds = parseInt(time[0]) * 60 + parseInt(time[1]);
            return leftSeconds * 1000;
          }, '#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
          .then(milliseconds => {
            logger.showAndLog(`${this.name} >>> now wait ${milliseconds / 1000}s`);
            this.nm.options.waitTimeout = milliseconds;
            return this.nm.wait(milliseconds);
          }).then(() => {
            this.checksum();
          }).catch(() => {
            this.checksum();
          })
        }
      }).catch((err) => {
        logger.showAndLog(`${this.name} >>> checksum catch error: ${err}`);
        this.nm.refresh();
        this.checksum();
        // showMsgInput(nm, checksum);
      });
  }
  showMsgInput(callback) {
    logger.showAndLog(`${this.name} >>> showMsgInput`);
    return this.nm
      .wait('#TabLIst > li > a[stype="chat"]') // 操作栏聊天选项
      .click('#TabLIst > li > a[stype="chat"]')
      .wait(10000)
      .visible('#Dvinputmsg') // 消息输入框
      .then(isvisible => {
        if (isvisible) {
          return callback && callback.call(this);
        } else {
          this.nm.refresh();
          this.showMsgInput(callback);
        }
      }).catch((err) => {
        logger.showAndLog(`${this.name} >>> showMsgInput catch error: ${err}`);
        this.nm.refresh();
        this.showMsgInput(callback);
      });
  }
  prepareLogin() {
    logger.showAndLog(`${this.name} >>> prepareLogin`);
    return this.nm
      .wait('#Dvinputmsg > div.extra > div')
      .click('#Dvinputmsg > div.extra > div')
      .visible('#dvGift > div > div')
      .then(isvisible => {
        if (isvisible) {
          return this.login();
        } else {
          this.prepareLogin();
        }
      }).catch(() => {
        this.nm.refresh();
        // prepareLogin(nm, entry);
        this.showMsgInput(() => {
          return this.prepareLogin();
        });
      });
  }
  start() {
    this.nm.options.waitTimeout = waitTimeout;
    return this.nm
      .goto(this.entry.video_url)
      .wait('#DvRoomList > div.bd > ul')
      .wait(1000)
      .click('#DvRoomList > div.bd > ul > li:last-child') // 进入直播
      .then(() => {
        return this.showMsgInput(() => {
          return this.prepareLogin();
        });
      }).catch((err) => {
        logger.showAndLog(`${this.name} >>> ${err}`);
        this.nm.refresh();
      });
  }
}

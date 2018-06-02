const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');
const waitTimeout = 1 * 60 * 1000;

exports.LiveVideo = class LiveVideo {
  constructor({show = process.env.show, entry}) {
    this.nm = new Nightmare({
      show,
      pollInterval: 2000,
      waitTimeout
    });
    this.entry = entry;
    this.logger = logFactory.getInstance();
    this.logger.setTemplate(this.constructor.name, this.entry.account);
  }  
  login() {
    this.logger.info(`login`);
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
        return this.showMsgInput(this.checksum);
      }).catch(() => {
        this.nm.refresh();
        return this.login();
      });
  }
  checksum() {
    this.logger.info(`checksum`);
    this.nm.options.waitTimeout = waitTimeout;
    return this.nm
      .wait('#Dvinputmsg > div.extra > div')
      .click('#Dvinputmsg > div.extra > div')
      .wait(2000)
      .wait('#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
      .number('#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.sum')
      .then(sum => {
        this.logger.info(`flowers: ${sum}`);
        if (sum > 1) {
          return this.nm.end().then(() => {
            this.logger.info(`app should close`);
            return true;
          });
        } else {
          return this.nm.evaluate(selector => {
            let time = document.querySelectorAll(selector)[0].innerText.split(':');
            let leftSeconds = parseInt(time[0]) * 60 + parseInt(time[1]);
            return leftSeconds * 1000;
          }, '#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
          .then(milliseconds => {
            this.logger.info(`now wait ${milliseconds / 1000}s`);
            this.nm.options.waitTimeout = milliseconds;
            return this.nm.wait(milliseconds);
          }).then(() => {
            return this.checksum();
          }).catch(() => {
            return this.checksum();
          })
        }
      }).catch((err) => {
        this.logger.error(`checksum catch error: ${err}`);
        this.nm.refresh();
        return this.checksum();
        // showMsgInput(nm, checksum);
      });
  }
  showMsgInput(callback) {
    this.logger.info(`showMsgInput`);
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
          return this.showMsgInput(callback);
        }
      }).catch((err) => {
        this.logger.error(`showMsgInput catch error: ${err}`);
        this.nm.refresh();
        return this.showMsgInput(callback);
      });
  }
  prepareLogin() {
    this.logger.info(`prepareLogin`);
    return this.nm
      .wait('#Dvinputmsg > div.extra > div')
      .click('#Dvinputmsg > div.extra > div')
      .visible('#dvGift > div > div')
      .then(isvisible => {
        if (isvisible) {
          return this.login();
        } else {
          return this.prepareLogin();
        }
      }).catch(() => {
        this.nm.refresh();
        // prepareLogin(nm, entry);
        return this.showMsgInput(() => {
          return this.prepareLogin();
        });
      });
  }
  start() {
    this.logger.info(`start`);
    this.nm.options.waitTimeout = waitTimeout;
    return this.nm
      .viewport(400, 800)
      .goto(this.entry.video_url)
      .wait('#DvRoomList > div.bd > ul')
      .wait(1000)
      .click('#DvRoomList > div.bd > ul > li:last-child') // 进入直播
      .then(() => {
        return this.showMsgInput(() => {
          return this.prepareLogin();
        });
      }).catch((err) => {
        this.logger.error(`${err}`);
        this.nm.refresh();
        return this.start();
      });
  }
}

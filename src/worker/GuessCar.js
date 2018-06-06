const Nightmare = require('nightmare');
const fs = require('fs');
const logFactory = require('../utils/logger');

exports.GuessCar =  class GuessCar {
  constructor ({show = process.env.show, entry, x, y, width, height}) {
    this.nm = new Nightmare({
      show,
      waitTimeout: 10000, x, y, width, height
    });
    this.entry = entry;
    this.times = 5;
    this.cars = {};
    this.logger = logFactory.getInstance();
    this.logger.setTemplate(this.constructor.name, this.entry.account);

    let carList = JSON.parse(fs.readFileSync(__dirname + '/cars.json'));
    for (let car in carList) {
      this.cars[carList[car].carID] = carList[car].carName;
    }
  }
  start() {
    this.logger.info(`start`);
    return this.nm
    .viewport(400, 800)
    .goto(this.entry.guess_car_url)
    .waitUntilVisible('#unlogin > a')
    .click('#unlogin > a')
    .wait(2000) // 等待iframe加载完毕
    .waitUntilVisible('#loginFrame')
    .wait(2000)
    .src('#loginFrame')
    .then((url) => {
      this.logger.info(`get login frame src: ${url}`);
      return this.nm
        .goto(url)
        .waitUntilVisible('#u') // account
        .type('#u', this.entry.account)
        .waitUntilVisible('#p') // password
        .type('#p', this.entry.password)
        .waitUntilVisible('#go') // login button
        .click('#go')
        .wait(2000) // 会有页面跳转刷新，等待结束继续
        .waitUntilVisible('#logined > span:nth-child(2) > a')
        .click('#logined > span:nth-child(2) > a')
        .waitUntilVisible('#areaContentId_speed')
        .select('#areaContentId_speed', '1')
        .waitUntilVisible('#roleContentId_speed')
        .select('#roleContentId_speed', this.entry.account)
        .waitUntilVisible('#confirmButtonId_speed')
        .click('#confirmButtonId_speed')
        .wait(3000)
        .evaluate((selector) => {
          return document.querySelector(selector).children.length;
        }, '#stamina')
        .then(async res => {
          await this.luckDraw();
          if (res > 0) {
            return this.nm
              .waitUntilVisible('body > div.wrap > div > div > a')
              .click('body > div.wrap > div > div > a')
              .then(() => {
                return this.guessLoop();
              }) // 开始游戏
          } else {
            this.logger.info(`times used up`);
            return this.nm
                .end()
                .then(() => {
                  this.logger.info(`app close`);
                  return true;
                });
          }
        }).catch(err => {
          this.logger.error(`${err}`);
          return this.nm
            .end()
            .then(() => {
              this.logger.info(`app close`);
              return true;
            });
        });
      
    })
  }
  resolveName(imageName) {
    this.logger.info(`resolve name`);
    return this.nm
    .wait(2500)
    .evaluate((imageName) => {
      let words = document.querySelectorAll('#inputName>li');
      let clickedWords = []; // 去重处理，避免叠词问题
      for (let name of imageName) {
        for (let i = 0; i < words.length; i++) {
          if (name === words[i].innerText && clickedWords.indexOf(words[i]) === -1) {
            words[i].click();
            clickedWords.push(words[i]);
            break;
          }
        }
      }
    }, imageName)
  }
  guessLoop() {
    this.logger.info(`guess loop`);
    if (this.times <= 0) {
      return this.nm
        .waitUntilVisible('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)')
        .click('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)') // 继续游戏的按钮
        .then(() => {
          this.times = 5;
          return this.guessLoop();
        }).catch(err => {
          // 不能继续猜车后等待超时退出
          this.logger.info(`app close with times used up`);
          return this.nm
            .end()
            .then(() => {
              return true;
            });
        })
    }
    this.times--;
    this.logger.info(`${this.times} times left`);
    return this.analyzeCar();
  }
  analyzeCar() {
    this.logger.info(`analyze car`);
    return this.nm
      .wait('#inputName')
      .wait(1000)
      .evaluate(selector => {
        let rect = parseInt(document.querySelector(selector).style.left) || 0;
        return document.querySelector(`#list_car>li:nth-child(${Math.ceil(Math.abs(rect / 360)) + 1})>img`).src;
      }, '#list_car')
      .then(url => {
        this.logger.info(`image url: ${url}`);
        // return ;
        if (typeof url !== 'string') {
          this.logger.info(`url fail to evaluate`);
          this.logger.info(`analyze car again`);
          return this.analyzeCar();
        }
        let imageId = parseInt(url.split('/').pop());
        let imageName = this.cars[imageId].split('');
        this.logger.info(`image name: ${imageName}`);
        return this.resolveName(imageName)
          .then(() => {
            return this.guessLoop();
          });
      }).catch(err => {
        this.logger.error(`${err}`);
        this.logger.error(`analyze car again`);
        return this.analyzeCar();
      });
  }
  luckDraw() {
    this.logger.info(`luck draw`);
    return this.nm
      .number('body > div.wrap > div > div > div.box_inte.c > div.inte_l > p')
      .then(res => {
        if (res > 500) {
          this.logger.info(`reward points: ${res} more than 500, begin to draw`);
          return this.nm
            .waitUntilVisible('body > div.wrap > div > div > div.box_inte.c > div.inte_l > a')
            .click('body > div.wrap > div > div > div.box_inte.c > div.inte_l > a') // 开始抽奖
            .then(this.draw.bind(this))
        }
        this.logger.info(`reward points: ${res} less than 500, exit`);
        return false;
      });
  }
  draw() {
    this.logger.info(`draw`);
    return this.nm
      .wait(2000)
      .waitUntilVisible('#swfcontent_start')
      .touch('#swfcontent_start')
      .wait(2000)
      .waitUntilVisible('body > div.pop_mask.pop_tips5 > div > div > div > a')
      .wait(1000)
      .click('body > div.pop_mask.pop_tips5 > div > div > div > a') // 隐藏奖励提示框
      .number('body > div.wrap > div > div > div.box_inte.c > div.inte_l > p') // 检查是否已经结束
      .then(res => {
        if (res >= 5) {
          this.logger.info(`left times: ${res}, go on`);
          return this.draw();
        }
        this.logger.info(`only ${res} left, can not continue, exit`);
        return ;
      }).catch(err => {
        this.logger.error(err);
        return this.luckDraw();
      });
  }
}
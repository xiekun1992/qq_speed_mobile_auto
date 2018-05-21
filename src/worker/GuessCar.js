const Nightmare = require('nightmare');
const fs = require('fs');
const logger = require('../utils/logger');

exports.GuessCar =  class GuessCar {
  constructor ({show = process.env.show, entry}) {
    this.nm = new Nightmare({
      show,
      waitTimeout: 10000
    });
    this.entry = entry;
    this.times = 5;
    this.cars = {};
    this.name = this.constructor.name;

    let carList = JSON.parse(fs.readFileSync(__dirname + '/cars.json'));
    for (let car in carList) {
      this.cars[carList[car].carID] = carList[car].carName;
    }
  }
  start() {
    return this.nm
    .goto(this.entry.guess_car_url)
    .waitUntilVisible('#unlogin > a')
    .click('#unlogin > a')
    .wait(2000) // 等待iframe加载完毕
    .waitUntilVisible('#loginFrame')
    .wait(2000)
    .src('#loginFrame')
    .then((url) => {
      logger.showAndLog(`${this.name} >>> get login frame src: ${url}`);
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
        .then(res => {
          if (res > 0) {
            return this.nm
              .click('body > div.wrap > div > div > a')
              .then(() => {
                return this.guessLoop();
              }) // 开始游戏
          } else {
            logger.showAndLog(`${this.name} >>> times used up`);
            return this.nm
                .end()
                .then(() => {
                  logger.showAndLog(`${this.name} >>> app close`);
                  return true;
                });
          }
        }).catch(err => {
          logger.showAndLog(`${this.name} >>> ${err}`);
          return this.nm
            .end()
            .then(() => {
              logger.showAndLog(`${this.name} >>> app close`);
              return true;
            });
        });
      
    })
  }
  resolveName(imageName) {
    return this.nm
    .wait(2500)
    .evaluate((imageName) => {
      let words = document.querySelectorAll('#inputName>li');
      for (let name of imageName) {
        for (let i = 0; i < words.length; i++) {
          if (name === words[i].innerText) {
            words[i].click();
            break;
          }
        }
      }
    }, imageName)
  }
  guessLoop() {
    if (this.times <= 0) {
      return this.nm
        .waitUntilVisible('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)')
        .click('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)') // 继续游戏的按钮
        .then(() => {
          this.times = 5;
          return this.guessLoop();
        }).catch(err => {
          // 不能继续猜车后等待超时退出
          logger.showAndLog(`${this.name} >>> app close with times used up`);
          return this.nm
            .end()
            .then(() => {
              return true;
            });
        })
    }
    this.times--;
    logger.showAndLog(`${this.name} >>> ${this.times} times left`);
    return this.analyzeCar();
  }
  analyzeCar() {
    return this.nm
      .wait('#inputName')
      .wait(1000)
      .evaluate(selector => {
        let rect = parseInt(document.querySelector(selector).style.left) || 0;
        return document.querySelector(`#list_car>li:nth-child(${Math.ceil(Math.abs(rect / 360)) + 1})>img`).src;
      }, '#list_car')
      .then(url => {
        logger.showAndLog(`${this.name} >>> image url: ${url}`);
        // return ;
        if (typeof url !== 'string') {
          logger.showAndLog(`${this.name} >>> url fail to evaluate`);
          logger.showAndLog(`${this.name} >>> analyze car again`);
          return this.analyzeCar();
        }
        let imageId = parseInt(url.split('/').pop());
        let imageName = this.cars[imageId].split('');
        logger.showAndLog(`${this.name} >>> image name: ${imageName}`);
        return this.resolveName(imageName)
          .then(() => {
            return this.guessLoop();
          });
      }).catch(err => {
        logger.showAndLog(`${this.name} >>> ${err}`);
        logger.showAndLog(`${this.name} >>> analyze car again`);
        return this.analyzeCar();
      });
  }
}
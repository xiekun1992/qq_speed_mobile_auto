const Nightmare = require('nightmare');
const fs = require('fs');
const logger = require('../utils/logger');

exports.GuessCar =  class GuessCar {
  constructor ({show = process.env.show, entry}) {
    this.nm = new Nightmare({show});
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
    .waitUntilVisible('#loginFrame')
    .src('#loginFrame')
    .then((url) => {
      return this.nm
        .goto(url)
        .waitUntilVisible('#u') // account
        .type('#u', this.entry.account)
        .waitUntilVisible('#p') // password
        .type('#p', this.entry.password)
        .waitUntilVisible('#go') // login button
        .click('#go')
        .waitUntilVisible('#logined > span:nth-child(2) > a')
        .click('#logined > span:nth-child(2) > a')
        .waitUntilVisible('#areaContentId_speed')
        .select('#areaContentId_speed', '1')
        .waitUntilVisible('#roleContentId_speed')
        .select('#roleContentId_speed', this.entry.account)
        .waitUntilVisible('#confirmButtonId_speed')
        .click('#confirmButtonId_speed')
        .wait(1000)
        .evaluate((selector) => {
          return document.querySelector(selector).children.length;
        }, '#stamina')
        .then(res => {
          // return guess(nm);
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
      this.nm
        .wait(5000)
        .visible('body > div.pop_mask.pop_tips4 > div > div > div > a') // 提示次数用完的弹出框
        .then(isvisible => {
          if (isvisible) {
            logger.showAndLog(`${this.name} >>> app close with times used up`);
            return this.nm
              .end()
              .then(() => {
                return true;
              });
          } else {
            return this.nm
              .click('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)') // 继续游戏的按钮
              .then(() => {
                this.times = 5;
                return this.guessLoop();
              })
          }
        })
    }
    this.times--;
    logger.showAndLog(`${this.name} >>> ${this.times} times left`);
    return this.nm
      .wait('#inputName')
      .wait(1000)
      .evaluate(selector => {
        let rect = parseInt(document.querySelector(selector).style.left) || 0;
        return document.querySelector(`#list_car>li:nth-child(${Math.abs(rect / 360) + 1})>img`).src;
      }, '#list_car')
      .then(url => {
        logger.showAndLog(`${this.name} >>> image url: ${url}`);
        // return ;
        let imageId = parseInt(url.split('/').pop());
        let imageName = this.cars[imageId].split('');
        logger.showAndLog(`${this.name} >>> image name: ${imageName}`);
        this.resolveName(imageName)
        .then(() => {
          return this.guessLoop();
        });
      })
  }
}
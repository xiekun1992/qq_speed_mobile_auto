const Nightmare = require('nightmare');
const fs = require('fs');
const logger = require('../utils/logger');
exports.GuessCar =  class GuessCar {
  constructor ({show = process.env.show}) {
    this.nm = new Nightmare({show});
    this.times = 5;
    this.cars = {};
    this.name = this.constructor.name;

    let carList = JSON.parse(fs.readFileSync(__dirname + '/cars.json'));
    for (let car in carList) {
      this.cars[carList[car].carID] = carList[car].carName;
    }
  }
  start(entry) {
    return this.nm
    .goto(entry.guess_car_url)
    .wait('#unlogin > a')
    .click('#unlogin > a')
    .wait(3000)
    .wait('#loginFrame')
    .evaluate(selector => {
      return document.querySelector(selector).src;
    }, '#loginFrame')
    .then((url) => {
      this.nm
        .goto(url)
        .wait('#u') // account
        .type('#u', entry.account)
        .wait('#p') // password
        .type('#p', entry.password)
        .wait('#go') // login button
        .click('#go')
        .wait(3000)
        .wait('#logined > span:nth-child(2) > a')
        .click('#logined > span:nth-child(2) > a')
        .wait('#areaContentId_speed')
        .wait(1500)
        .select('#areaContentId_speed', '1')
        .wait(1000)
        .wait('#roleContentId_speed')
        .wait(1500)
        .select('#roleContentId_speed', entry.account)
        .wait(1000)
        .click('#confirmButtonId_speed')
        .wait(1000)
        // .click('body > div.wrap > div > div > a')
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
            return Promise.reject('times used up');
          }
        }).catch(err => {
          logger.showAndLog(`${this.name} >>> ${err}`);
          return this.nm
            .end()
            .then(() => {
              logger.showAndLog(`${this.name} >>> app close`);
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
      // nm
      //   .wait(5000)
      //   .visible('body > div.pop_mask.pop_tips4 > div > div > div > a')
      //   .then(isvisible => {
      //     if (isvisible) {
      //       return nm
      //         .click('body > div.pop_mask.pop_tips4 > div > div > div > a')
      //         .then(() => {
      //           console.log('${this.name} is over');
      //           return 0;
      //         })
      //     } else {
            return this.nm
              .wait(3000)
              .click('body > div.pop_mask.pop_tips1 > div > div > div > a:nth-child(2)')
              .then(() => {
                this.times = 5;
                return this.guessLoop();
              })
        //   }
        // })
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
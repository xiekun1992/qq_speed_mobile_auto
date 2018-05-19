const Nightmare = require('nightmare');
const logger = require('../utils/logger');

exports.Daoju = class Daoju {
    constructor({show = process.env.show, entry}) {
        this.nm = new Nightmare({
            show,
            waitTimeout: 10000
        });
        this.entry = entry;
        this.name = this.constructor.name;
        this.max = 150;
        this.min = 2;
    }
    checkSum() {
        logger.showAndLog(`${this.name} >>> check sum`);
        // 特定时间统一抽奖
        return this.nm
        .number('#judou_num')
        .then(sum => {
            logger.showAndLog(`${this.name} >>> check sum: ${sum}`);
            if (sum >= this.max) { // 每天5个，30天抽一次
                return this.luckDraw();
            }
            return this.nm
                .end()
                .then(() => {
                    logger.showAndLog(`${this.name} >>> app close without luck draw`);
                });
        })
        .catch(err => {
            logger.showAndLog(`${this.name} >>> ${err}`);
        })
    }
    luckDraw() {
        logger.showAndLog(`${this.name} >>> luck draw`);
        return this.nm
            .wait('#judou_wrapper_list') // 物品列表
            .wait('#judou_wrapper_list>li:nth-last-child(2) #buy_btn')
            .click('#judou_wrapper_list>li:nth-last-child(2) #buy_btn')
            .wait('#judou_wrapper_list>li:nth-last-child(2) > .tc1 > div.tc-cont.c > div > a')
            .click('#judou_wrapper_list>li:nth-last-child(2) > .tc1 > div.tc-cont.c > div > a')
            .wait(1000)
            .wait(selector => {
                return document.querySelector(selector) && !!document.querySelector(selector).getBoundingClientRect().width;
            }, '#areaContentId_speed')
            .select('#areaContentId_speed', '1')
            .wait(selector => {
                return document.querySelector(selector) && !!document.querySelector(selector).getBoundingClientRect().width;
            }, '#roleContentId_speed')
            .select('#roleContentId_speed', this.entry.account)
            .click('#confirmButtonId_speed')
            .number('#judou_num')
            .then(sum => {
                logger.showAndLog(`${this.name} >>> check sum: ${sum}`);
                if (sum >= this.min) {
                    return this.luckDraw();
                } else {
                    return this.nm
                        .end()
                        .then(() => {
                            logger.showAndLog(`${this.name} >>> app close after luck draw`);
                        });
                }
            })
            .catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
            });
    }
    sign() {
        logger.showAndLog(`${this.name} >>> sign`);
        return this.nm
            // 等待签到按钮显示并签到
            .wait(selector => {
                return document.querySelector(selector) && !!document.querySelector(selector).getBoundingClientRect().width;
            }, '#logined_index')
            .wait('#btn_signin')
            .click('#btn_signin')
            // 领取聚豆奖励
            .wait((selector, selector1) => {
                return document.querySelector(selector) && !!document.querySelector(selector).getBoundingClientRect().width || document.querySelector(selector1) && !!document.querySelector(selector1).getBoundingClientRect().width;
            }, '#golingqu > a', '#signandget')
            .click('#golingqu > a')
            .click('#signandget')
            .then(() => {
                return this.checkSum();
            })
            .catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
                // 忽略等待奖励领取的报错
                return this.checkSum();
            });
    }
    start() {
        logger.showAndLog(`${this.name} >>> start`);
        return this.nm
            .goto(this.entry.daoju_url)
            .wait('#switcher_plogin')
            .click('#switcher_plogin')
            .wait(500)
            .wait('#u')
            .type('#u', this.entry.account)
            .wait('#p')
            .type('#p', this.entry.password)
            .wait('#login_button')
            .click('#login_button')
            .wait(3000)
            .title()
            .then((title) => {
                if (!title) {
                    throw new Error(false);
                }
                return this.sign();
            })
            .catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
                logger.showAndLog(`${this.name} >>> login error, restart it`);
                return this.start();
            });
    }
}
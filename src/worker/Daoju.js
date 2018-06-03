const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');

exports.Daoju = class Daoju {
    constructor({show = process.env.show, entry, x, y, width, height}) {
        this.nm = new Nightmare({
            show,
            waitTimeout: 10000, x, y, width, height
        });
        this.entry = entry;
        this.logger = logFactory.getInstance();
        this.logger.setTemplate(this.constructor.name, this.entry.account);
        this.max = 150;
        this.min = 2;
    }
    checkSum() {
        this.logger.info(`check sum`);
        // 特定时间统一抽奖
        return this.nm
        .waitUntilVisible('#judou_num')
        .number('#judou_num')
        .then(sum => {
            this.logger.info(`check sum: ${sum}`);
            if (sum >= this.max) { // 每天5个，30天抽一次
                return this.luckDraw();
            }
            return this.nm
                .end()
                .then(() => {
                    this.logger.info(`app close without luck draw`);
                    return true;
                });
        })
        .catch(err => {
            this.logger.error(`${err}`);
            return this.nm
                .end()
                .then(() => {
                    return true;
                });
        })
    }
    luckDraw() {
        this.logger.info(`luck draw`);
        return this.nm // 物品列表
            .waitUntilVisible('#judou_wrapper_list>li:nth-last-child(2) #buy_btn')
            .click('#judou_wrapper_list>li:nth-last-child(2) #buy_btn')
            .waitUntilVisible('#judou_wrapper_list>li:nth-last-child(2) > .tc1 > div.tc-cont.c > div > a')
            .click('#judou_wrapper_list>li:nth-last-child(2) > .tc1 > div.tc-cont.c > div > a')
            .wait(1000)
            .waitUntilVisible('#areaContentId_speed')
            .select('#areaContentId_speed', '1')
            .waitUntilVisible('#roleContentId_speed')
            .select('#roleContentId_speed', this.entry.account)
            .click('#confirmButtonId_speed')
            .waitUntilVisible('#judou_num')
            .number('#judou_num')
            .then(sum => {
                this.logger.info(`check sum: ${sum}`);
                if (sum >= this.min) {
                    return this.luckDraw();
                } else {
                    return this.nm
                        .end()
                        .then(() => {
                            this.logger.info(`app close after luck draw`);
                            return true;
                        });
                }
            })
            .catch(err => {
                this.logger.error(`${err}`);
                return this.nm
                    .end()
                    .then(() => {
                        return true;
                    });
            });
    }
    getBeans() {
        this.logger.info(`get beans`);
        // 领取聚豆奖励
        return this.nm
            .wait((selector, selector1) => {
                return document.querySelector(selector) && !!document.querySelector(selector).getBoundingClientRect().width || document.querySelector(selector1) && !!document.querySelector(selector1).getBoundingClientRect().width;
            }, '#golingqu > a', '#signandget')
            .click('#golingqu > a')
            .click('#signandget')
            .wait(9000) // 等待点击后数据刷新完毕
            .then(() => {
                return this.checkSum();
            })
            .catch(err => {
                this.logger.error(`${err}`);
                // 忽略等待奖励领取的报错
                return this.checkSum();
            });
    }
    sign() {
        this.logger.info(`sign`);
        return this.nm
            // .wait(3000)
            // // 等待签到按钮显示并签到
            .waitUntilVisible('#logined_index')
            // .wait('#btn_signin.sign-btn')
            .waitUntilVisible('#btn_signin.sign-btn')
            // .wait(3000)
            .click('#btn_signin.sign-btn')
            .then(() => {
                this.logger.info(`find sign button, signed`);
                return this.getBeans();
            }).catch(err => {
                this.logger.error(`${err}`);
                this.logger.info(`not find sign button, probably signed`);
                return this.getBeans();
            });
    }
    start() {
        this.logger.info(`start`);
        // this.nm.goto(this.entry.daoju_url).then(() => this.logger.info('here'));
        return this.nm
            .cookies.clearAll()
            .goto(this.entry.daoju_url)
            .waitUntilVisible('#switcher_plogin')
            .click('#switcher_plogin')
            .waitUntilVisible('#u')
            .type('#u', this.entry.account)
            .waitUntilVisible('#p')
            .type('#p', this.entry.password)
            .waitUntilVisible('#login_button')
            .click('#login_button')
            .wait(3000)
            .title()
            .then((title) => {
                this.logger.info(`page title: ${title}`);
                if (!title) {
                    return this.nm.url().then(url => {
                        throw new Error(`tencent captcha coming, url: ${url}`);
                    });
                }
                return this.sign();
            })
            .catch(err => {
                this.logger.error(`${err}`);
                return this.nm
                    .end()
                    .then(() => {
                        return true;
                    });
            });
    }
}
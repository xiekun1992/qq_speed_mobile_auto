const Nightmare = require('nightmare');
const logger = require('../utils/logger');

exports.FunWeekly = class FunWeekly {
    constructor({show = process.env.show, entry}) {
        this.nm = new Nightmare({
            show
        });
        this.entry = entry;
        this.name = `${this.constructor.name} - ${this.entry.account}`;
    }
    start() {
        logger.showAndLog(`${this.name} >>> start`);
        return this.nm
            .viewport(400, 800)
            .goto(this.entry.fun_weekly_url)
            .wait(2000)
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
                    .wait(2000)
                    .then(() => {
                        return this.nm
                            .waitUntilVisible('#a011')
                            .click('#a011') // 领取周六奖励
                            .waitUntilVisible('#pop2 > div > a.pop_btn.sp.db')
                            .click('#pop2 > div > a.pop_btn.sp.db') // 隐藏周六奖励弹框
                            .wait(1000)
                            .waitUntilVisible('#a012')
                            .click('#a012') // 领取周六奖励
                            .click('#pop2 > div > a.pop_btn.sp.db') // 隐藏周六奖励弹框
                            .wait(2000)
                            .end()
                            .then(() => {
                                logger.showAndLog(`${this.name} >>> app close`);
                                return true;
                            }).catch(err => {
                                logger.showAndLog(`${this.name} >>> ${err}`);
                            })
                    })
                    .catch(err => {
                        logger.showAndLog(`${this.name} >>> ${err}`);
                        return this.start();
                    });
            }).catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
                return this.start();
            });
    }
}
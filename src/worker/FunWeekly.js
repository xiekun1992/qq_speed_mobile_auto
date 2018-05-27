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
    isWeekDay() { // 判断当前是否是周末
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 6 || dayOfWeek === 0) { // 是周六或周日
            logger.showAndLog(`${this.name} >>> isWeekDay: ${!dayOfWeek? 'Sunday': 'Saturday'}`);
            return true;
        }
        logger.showAndLog(`${this.name} >>> isWeekDay: no`);
        return false;
    }
    receiveReward() {
        logger.showAndLog(`${this.name} >>> receiveReward`);
        let findAvalPanel = () => {
            let els = document.querySelectorAll('.show_panel');
            for (let el of els) {
                let rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return el.id;
                }
            }
        };
        return this.nm
            .wait(findAvalPanel)
            .evaluate(findAvalPanel)
            .then(id => {
                logger.showAndLog(`${this.name} >>> receiveReward get panel id: ${id}`);
                return this.nm
                    .waitUntilVisible(`#${id} .content_a a.btn_lq.sp.db`)
                    .click(`#${id} .content_a a.btn_lq.sp.db`) // 领取周六奖励
                    .waitUntilVisible('#pop2 > div > a.pop_btn.sp.db')
                    .click('#pop2 > div > a.pop_btn.sp.db') // 隐藏周六奖励弹框
                    .wait(1000)
                    .waitUntilVisible(`#${id} .content_b a.btn_lq.sp.db`)
                    .click(`#${id} .content_b a.btn_lq.sp.db`) // 领取周六奖励
                    .waitUntilVisible('#pop2 > div > a.pop_btn.sp.db')
                    .click('#pop2 > div > a.pop_btn.sp.db') // 隐藏周六奖励弹框
                    .wait(2000)
                    .end()
            }).then(() => {
                logger.showAndLog(`${this.name} >>> app close`);
                return true;
            }).catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
            })
    }
    start() {
        logger.showAndLog(`${this.name} >>> start`);
        if (!this.isWeekDay()) {
            return Promise.resolve(false);
        }
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
            }).then(() => {
                return this.receiveReward();
            }).catch(err => {
                logger.showAndLog(`${this.name} >>> ${err}`);
                return this.start();
            });
    }
}
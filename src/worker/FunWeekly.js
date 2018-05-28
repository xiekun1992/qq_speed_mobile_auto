const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');

exports.FunWeekly = class FunWeekly {
    constructor({show = process.env.show, entry}) {
        this.nm = new Nightmare({
            show
        });
        this.entry = entry;
        this.logger = logFactory.getInstance();
        this.logger.setTemplate(this.constructor.name, this.entry.account);
    }
    isWeekDay() { // 判断当前是否是周末
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 6 || dayOfWeek === 0) { // 是周六或周日
            this.logger.info(`isWeekDay: ${!dayOfWeek? 'Sunday': 'Saturday'}`);
            return true;
        }
        this.logger.info(`isWeekDay: no`);
        return false;
    }
    receiveReward() {
        this.logger.info(`receiveReward`);
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
                this.logger.info(`receiveReward get panel id: ${id}`);
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
                this.logger.info(`app close`);
                return true;
            }).catch(err => {
                this.logger.error(`${err}`);
            })
    }
    start() {
        this.logger.info(`start`);
        if (!this.isWeekDay()) {
            return Promise.resolve(true);
        }
        return this.nm
            .viewport(400, 800)
            .goto(this.entry.fun_weekly_url)
            .wait(2000)
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
                    .wait(2000)
            }).then(() => {
                return this.receiveReward();
            }).catch(err => {
                this.logger.error(`${err}`);
                return this.start();
            });
    }
}
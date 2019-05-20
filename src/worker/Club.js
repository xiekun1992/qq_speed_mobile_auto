const Nightmare = require('nightmare');
const logFactory = require('../utils/logger');

exports.Club = class Club {
    constructor({show = process.env.show, entry, x, y, width, height, proxy}) {
        const option = {
            alwaysOnTop: false,
            show, x, y, width, height
        };
        if (proxy) {
            option.switches = proxy;
        }
        this.nm = new Nightmare(option);
        this.entry = entry;
        this.logger = logFactory.getInstance();
        this.logger.setTemplate(this.constructor.name, this.entry.account);
    }
    receiveReward() {
        return this.nm
            .wait(3000)
            .wait('body > div.wrap > div.content > div.cont_page > div.page.curr > div.pouter > ul > li.nth1 > a')
            .click('body > div.wrap > div.content > div.cont_page > div.page.curr > div.pouter > ul > li.nth1 > a')
            .wait(3000)
            .wait('body > div.wrap > div.content > div.cont_tab > a.nth2.spr')
            .click('body > div.wrap > div.content > div.cont_tab > a.nth2.spr')
            .wait(1000)
            .wait('#cj_box_start')
            .click('#cj_box_start')
            .wait(3000)
            .wait('body > div.wrap > div.content > div.cont_page > div.page.curr > div:nth-child(2) > div > div:nth-child(2) > a')
            .click('body > div.wrap > div.content > div.cont_page > div.page.curr > div:nth-child(2) > div > div:nth-child(2) > a')
            .wait(2000)
            .then(() => {
                return this.nm.end().then(() => {
                    this.logger.info(`app close`);
                    return true;
                })
            }).catch(err => {
                this.logger.error(`${err}`);
                this.nm.end().then(() => {
                    this.logger.info(`app close with error accur`);
                    return true;
                });
            })
    }
    start() {
        this.logger.info(`start`);
        return this.nm
            .viewport(400, 800)
            .goto(this.entry.xinyue_club_url)
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
                    .wait(6000)
                    // .wait('#spanBind_449016 > a')
                    // .click('#spanBind_449016 > a')
                    // .waitUntilVisible('#areaContentId_speed')
                    // .select('#areaContentId_speed', '1')
                    // .waitUntilVisible('#roleContentId_speed')
                    // .select('#roleContentId_speed', this.entry.account)
                    // .waitUntilVisible('#confirmButtonId_speed')
                    // .click('#confirmButtonId_speed')
                    // .wait(3000)
            }).then(() => {
                return this.receiveReward();
            }).catch(err => {
                this.logger.error(`${err}`);
                return this.start();
            });
    }
}
const Nightmare = require('nightmare');

// 自动每日寻宝
function checkLeftTimes(nm) {
  // 领取上次寻宝的奖励，如果显示了的话
  nm
    .visible('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
    .then(isvisible => {
      if (isvisible) {
        nm
          .wait(1000)
          .screenshot(`./screen_shots/${new Date().format()}.png`) // 记录奖励
          .wait(1000)
          .click('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
      }
    })
  return nm
    .wait('#leftTimes')
    .wait(3000)
    .evaluate(selector => {
      return +document.querySelector(selector).innerText;
    }, '#leftTimes')
    .then(times => {
      if (times > 0) {
        return huntTreasure(nm);
      } else {
        console.log('times used up', times);
        return nm.end().then(res => 0);
      }
    });
}
function huntTreasure(nm) {
  return nm
    .wait('#application > div.tabs > ul')
    .clickLast('#application > div.tabs > ul > li:not(.suo)')
    // 进入寻宝
    .wait('#application > div.tabs > div.tabs-bd > div.ditu-warp>ul:not(.hideClassName) > li div.tit-flog')
    .wait(1000)
    .click('#application > div.tabs > div.tabs-bd > div.ditu-warp>ul:not(.hideClassName) > li div.tit-flog') // 选择今日大吉的地图
    .wait('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)')
    .wait(1000)
    .click('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)') // 选择普通寻宝
    .wait('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
    .wait(1000)
    .screenshot(`./screen_shots/${new Date().format()}.png`) // 记录奖励
    .wait(1000)
    .click('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow') // 开始寻宝
    // 等待寻宝完成
    .wait(1.01 * 10 * 60 * 1000)
    // 领取奖励
    .wait('#result_show')
    .screenshot(`./screen_shots/${new Date().format()}.png`)
    .click('#result_show > div > div.btn-box > a')
    .then((res) => {
      console.log(res);
      return checkLeftTimes(nm);
    });
}
function start(entry) {
  const nm = Nightmare({
    show: process.env.show,
    waitTimeout: 1000 * 60 * 20
  });
  return nm
    .goto(entry.treasure_url)
    .wait('#u') // account
    .type('#u', entry.account)
    .wait('#p') // password
    .type('#p', entry.password)
    .wait('#go') // login button
    .screenshot(`./screen_shots/${new Date().format()}.png`)
    .click('#go')
    .wait('#application > div.tabs > ul')
    .visible('#treasurenormal_popbox') // 检测当前是否在寻宝
    .then(res => {
      if (res) {
        return checkLeftTimes(nm);
      } else {
        return nm
          .wait('#dig_tip_container')
          .then(res => {
            return checkLeftTimes(nm);
          });
      }
    }).catch(err => {
      console.log(err);
      return nm.end().then(console.log);
    });
}

exports.start = start;
const Nightmare = require('nightmare');
// 需要账号当天登陆过才行
// 自动每日寻宝
const a = 'http://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E5%A4%9C%E5%A4%9C%E9%85%B1oc&uin=2195619068&uniqueRoleId=162532724&token=8y7dGRcE&userId=75507990&nickname=Satan&serverName=&roleId=2195619068&serverId=0&areaId=1&roleJob=&isMainRole=1&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=155&toUin=2195619068&';
const b = 'http://bang.qq.com/app/speed/treasure/index?gameId=10013&roleName=%E4%B8%B6Guerlsseur&uin=840914927&uniqueRoleId=167249511&token=8y7dGRcE&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=140&toUin=840914927&';

const nm = Nightmare({
    show: true,
    waitTimeout: 1000 * 60 * 10 * 1.01
});

let failTimes = 5, leftTimes = 0;

function huntTreasure() {
  return nm
    .evaluate(selector => {
      console.log(document.querySelector(selector).innerText);
      leftTimes = document.querySelector(selector).innerText;
      return leftTimes;
    }, '#leftTimes')
    // 进入寻宝
    .wait('#maps_2 > li div.tit-flog')
    .click('#maps_2 > li div.tit-flog')
    .wait('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)')
    .click('#application > div.tabs > div.tabs-bd > div.btn-warp > div.anniu > a:nth-child(1)')
    .wait('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
    .click('#application > div.tabs > div:nth-child(4) > div > div.btn-box > a.yellow')
    // 等待寻宝完成
    .wait(selector => {
      return window.getComputedStyle(document.querySelector(selector)).display === 'none'? true: false;
    }, '#dig_tip_container')
    .then(res => {
      // 查看寻宝次数
      if (!res) {
        failTimes--;
      }
      if (failTimes < 0) {
        console.log('failTimes is lower than 0');
        console.log(`${new Date()}, left times: ${leftTimes}`);
      } else {
        huntTreasure();
      }
    });
}

nm
  .goto(b)
  .wait('#application > div.tabs > ul')
  .evaluate(selector => {
    const ele = document.querySelectorAll(selector);
    return ele[ele.length - 1].click();
  }, '#application > div.tabs > ul > li:not(.suo)')
  .evaluate(selector => {
    return window.getComputedStyle(document.querySelector(selector)).display === 'none'? true: false;
  },'#treasurenormal_popbox') // 检测当前是否在寻宝
  .then(res => {
    if (res) {
      huntTreasure();
    } else {
      nm
        .wait(selector => {
          return window.getComputedStyle(document.querySelector(selector)).display === 'none'? true: false;
        }, '#dig_tip_container')
        .then(res => {
          huntTreasure();
        });
    }
  })
  .catch(console.error);
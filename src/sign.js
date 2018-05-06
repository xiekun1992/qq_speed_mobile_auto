
const b = 'http://bang.qq.com/app/gift/sign/month/speed?gameId=10013&roleName=%E4%B8%B6Guerlsseur&uin=840914927&uniqueRoleId=167249511&token=8y7dGRcE&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=140&toUin=840914927&';
const a = 'http://bang.qq.com/app/gift/sign/month/speed?gameId=10013&roleName=%E5%A4%9C%E5%A4%9C%E9%85%B1oc&uin=2195619068&uniqueRoleId=162532724&token=8y7dGRcE&userId=75507990&nickname=Satan&serverName=&roleId=2195619068&serverId=0&areaId=1&roleJob=&isMainRole=1&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=155&toUin=2195619068&';

const Nightmare = require('nightmare');
const nm = Nightmare({
    show: true
});

function signWeek() {
  nm
    .evaluate(selector => {
      const liEl = document.querySelectorAll(selector)[0];
      const event = document.createEvent('HTMLEvents');
      event.initEvent('touchstart', true, true);
      liEl.dispatchEvent(event);
    }, '#giftTab > div.hd > ul > li:nth-child(2)')
    .wait(1000)
    .evaluate(selector => {
      return !!document.querySelector(selector);
    }, '#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
    .then(canReceive => {
      if (canReceive) {
        nm
          .click('#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
          .wait(3000)
          .visible('body > div.bang-dialog-dialog')
          .then(isvisible => {
            if (isvisible) {
              nm
                .wait('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .wait(1000)
                .end()
                .then(() => {
                  console.log('sign close');
                })
            } else {
              nm.refresh();
              signWeek();
            }
          }).catch(err => {
            nm.refresh();
            signWeek();
          });

      } else {
        nm
          .end()
          .then(() => {
            console.log('sign close');
          })
      }
    }).catch(err => {
      nm.refresh();
      signWeek();
    });
}

function signDay() {
  nm
    .goto(b)
    .wait('#signButton')
    .evaluate(selector => {
      const btnEl = document.querySelectorAll(selector)[0];
      return btnEl.classList.contains('btn_sign');
    }, '#signButton')
    .then(canSign => {
      if (canSign) {
        return nm
          .click('#signButton')
          .wait(3000)
          .visible('body > div.bang-dialog-dialog')
          .then(isvisible => {
            if (isvisible) {
              nm
                .wait('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .wait(1000)
                .then(() => {
                  signWeek();
                })
            } else {
              nm.refresh();
              signDay();
            }
          }).catch(err => {
            nm.refresh();
            signDay();
          });
      } else {
        return signWeek();
      }
    })
}

signDay();

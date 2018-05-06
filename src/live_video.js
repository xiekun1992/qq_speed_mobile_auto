const Nightmare = require('nightmare');

const waitTimeout = 1/6 * 60 * 1000;
const nm = Nightmare({
  // show: true,
  waitTimeout
});
const entry = [
  {
    url: 'http://qt.qq.com/php_cgi/plive/speed/html/index.html?gameId=10013&roleName=%E5%A4%9C%E5%A4%9C%E9%85%B1oc&uin=2195619068&uniqueRoleId=162532724&token=8y7dGRcE&userId=75507990&nickname=Satan&serverName=&roleId=2195619068&serverId=0&areaId=1&roleJob=&isMainRole=1&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=155&toUin=2195619068&',
    account: 2195619068,
    password: 'xiekun4559610300'
  },
  {
    url: 'http://qt.qq.com/php_cgi/plive/speed/html/index.html?gameId=10013&roleName=%E4%B8%B6Guerlsseur&uin=840914927&uniqueRoleId=167249511&token=8y7dGRcE&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=140&toUin=840914927&',
    account: 840914927,
    password: 'xk/15727451939'
  }
]

function login(entry) {
  console.log('login');
  return nm
    .wait('#dvGift > div > div > div.gin_gift_box > div.gin_hd > div.gin_extra > span > a')
    .click('#dvGift > div > div > div.gin_gift_box > div.gin_hd > div.gin_extra > span > a')
    .wait('#u') // account
    .type('#u', entry.account)
    .wait('#p') // password
    .type('#p', entry.password)
    .wait('#go') // login button
    .click('#go')
    .then(() => {
      showMsgInput(checksum);
    }).catch(() => {
      nm.refresh();
      login(entry);
    });
}

function checksum() {
  console.log('checksum');
  nm.options.waitTimeout = waitTimeout;
  return nm
    .wait('#Dvinputmsg > div.extra > div')
    .click('#Dvinputmsg > div.extra > div')
    .wait(2000)
    .wait('#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
    .evaluate(selector => {
      let sum = document.querySelectorAll(selector)[0].innerText;
      return sum.slice(1);
    }, '#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.sum')
    .then(sum => {
      console.log('flowers: ', sum);
      if (sum > 1) {
        nm.end(() => console.log('app should close'));
      } else {
        nm.evaluate(selector => {
          let time = document.querySelectorAll(selector)[0].innerText.split(':');
          let leftSeconds = parseInt(time[0]) * 60 + parseInt(time[1]);
          return leftSeconds * 1000;
        }, '#dvGift > div > div > div.gin_gift_box > div.gin_bd > div.gin_roll_box > ul > li:nth-child(1) > div.thumb > div.update_count')
        .then(milliseconds => {
          console.log('now wait', milliseconds / 1000, 's');
          nm.options.waitTimeout = milliseconds;
          return nm.wait(milliseconds);
        }).then(nm => {
          checksum();
        }).catch(() => {
          checksum();
        })
      }
    }).catch(() => {
      nm.refresh();
      showMsgInput(checksum);
    });
}
function showMsgInput(callback) {
  console.log('showMsgInput');
  return nm
    .wait('#TabLIst > li > a[stype="chat"]') // 操作栏聊天选项
    .click('#TabLIst > li > a[stype="chat"]')
    .wait(2000)
    .visible('#Dvinputmsg') // 消息输入框
    .then(isvisible => {
      console.log('showMsgInput', isvisible);
      if (isvisible) {
        callback && callback();
      } else {
        return showMsgInput();
      }
    }).catch(() => {
      nm.refresh();
      showMsgInput(callback);
    });
}
function prepareLogin(entry) {
  console.log('prepareLogin', entry);
  return nm
    .wait('#Dvinputmsg > div.extra > div')
    .click('#Dvinputmsg > div.extra > div')
    .visible('#dvGift > div > div')
    .then(isvisible => {
      console.log('prepareLogin', isvisible)
      if (isvisible) {
        return login(entry);
      } else {
        return prepareLogin(entry);
      }
    }).catch(() => {
      nm.refresh();
      // prepareLogin(entry);
      showMsgInput(function () {
        prepareLogin(entry);
      });
    });
}
function start(entry) {
  nm.options.waitTimeout = waitTimeout;
  return nm
    .goto(entry.url)
    .wait('#DvRoomList > div.bd > ul')
    .wait(1000)
    .click('#DvRoomList > div.bd > ul > li:last-child') // 进入直播
    .then(() => {
      showMsgInput(function () {
        prepareLogin(entry);
      });
    }).catch(() => {
      nm.refresh();
    });
}

start(entry[1]);
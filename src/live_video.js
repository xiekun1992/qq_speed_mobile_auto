const Nightmare = require('nightmare');

const waitTimeout = 1 * 60 * 1000;

function login(nm, entry) {
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
      showMsgInput(nm, checksum);
    }).catch(() => {
      nm.refresh();
      login(nm, entry);
    });
}

function checksum(nm) {
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
      if (sum > 2) {
        return nm.end().then(() => console.log('app should close'));
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
          checksum(nm);
        }).catch(() => {
          checksum(nm);
        })
      }
    }).catch((err) => {
      console.log('checksum catch error', err);
      nm.refresh();
      checksum(nm);
      // showMsgInput(nm, checksum);
    });
}
function showMsgInput(nm, callback) {
  console.log('showMsgInput');
  return nm
    .wait('#TabLIst > li > a[stype="chat"]') // 操作栏聊天选项
    .click('#TabLIst > li > a[stype="chat"]')
    .wait(10000)
    .visible('#Dvinputmsg') // 消息输入框
    .then(isvisible => {
      console.log('showMsgInput', isvisible);
      if (isvisible) {
        return callback && callback(nm);
      } else {
        nm.refresh();
        showMsgInput(nm, callback);
      }
    }).catch((err) => {
      console.log('showMsgInput catch error', err);
      nm.refresh();
      showMsgInput(nm, callback);
    });
}
function prepareLogin(nm, entry) {
  console.log('prepareLogin');
  return nm
    .wait('#Dvinputmsg > div.extra > div')
    .click('#Dvinputmsg > div.extra > div')
    .visible('#dvGift > div > div')
    .then(isvisible => {
      console.log('prepareLogin', isvisible)
      if (isvisible) {
        return login(nm, entry);
      } else {
        prepareLogin(nm, entry);
      }
    }).catch(() => {
      nm.refresh();
      // prepareLogin(nm, entry);
      showMsgInput(nm, function () {
        return prepareLogin(nm, entry);
      });
    });
}
function start(entry) {
  const nm = Nightmare({
    show: process.env.show,
    pollInterval: 2000,
    waitTimeout
  });
  nm.options.waitTimeout = waitTimeout;
  return nm
    .goto(entry.video_url)
    .wait('#DvRoomList > div.bd > ul')
    .wait(1000)
    .click('#DvRoomList > div.bd > ul > li:last-child') // 进入直播
    .then(() => {
      return showMsgInput(nm, function (nm) {
        return prepareLogin(nm, entry);
      });
    }).catch((err) => {
      console.log(err);
      nm.refresh();
    });
}

exports.start = start;
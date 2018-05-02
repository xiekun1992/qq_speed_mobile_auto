
const b = 'http://bang.qq.com/app/gift/sign/month/speed?gameId=10013&roleName=%E4%B8%B6Guerlsseur&uin=840914927&uniqueRoleId=167249511&token=8y7dGRcE&userId=75507990&nickname=ordinary&serverName=&roleId=840914927&serverId=0&areaId=1&roleJob=&isMainRole=0&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=140&toUin=840914927&';
const a = 'http://bang.qq.com/app/gift/sign/month/speed?gameId=10013&roleName=%E5%A4%9C%E5%A4%9C%E9%85%B1oc&uin=2195619068&uniqueRoleId=162532724&token=8y7dGRcE&userId=75507990&nickname=Satan&serverName=&roleId=2195619068&serverId=0&areaId=1&roleJob=&isMainRole=1&areaName=%E7%94%B5%E4%BF%A1%E5%8C%BA&roleLevel=155&toUin=2195619068&';

const Nightmare = require('nightmare');
const nm = Nightmare({
    show: true,
    waitTimeout: 1000 * 60 * 10 * 1.01
});

nm
  .goto(b)
  .wait('#signButton')
  .click('#signButton')
  .wait('body > div:nth-child(1) > div.bang-dialog-dialog-bt > a')
  .click('body > div:nth-child(1) > div.bang-dialog-dialog-bt > a')
  .then(console.log)
  .catch(console.error)

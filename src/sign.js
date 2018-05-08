const Nightmare = require('nightmare');

function signWeek(nm) {
  return nm
    .touch('#giftTab > div.hd > ul > li:nth-child(2)')
    .wait(1000)
    .evaluate(selector => {
      return !!document.querySelector(selector);
    }, '#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
    .then(canReceive => {
      if (canReceive) {
        return nm
          .click('#giftTab > div.bd > div:nth-child(2) > div:nth-child(1) > div > div.box > a.receive')
          .wait(3000)
          .visible('body > div.bang-dialog-dialog')
          .then(isvisible => {
            if (isvisible) {
             return nm
                .wait('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .wait(1000)
                .end()
                .then(() => {
                  console.log('sign close');
                  return nm
                    .end()
                    .then(() => {
                      console.log('sign close');
                      return 0;
                    })
                })
            } else {
              nm.refresh();
              return signWeek(nm);
            }
          }).catch(err => {
            nm.refresh();
            return signWeek(nm);
          });

      } else {
        return nm
          .end()
          .then(() => {
            console.log('sign close');
            return 0;
          })
      }
    }).catch(err => {
      nm.refresh();
      return signWeek(nm);
    });
}

function signDay(nm, url) {
  return nm
    .goto(url)
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
              return nm
                .wait('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .click('body > div.bang-dialog-dialog > div.bang-dialog-dialog-bt > a')
                .wait(1000)
                .then(() => {
                  return signWeek(nm);
                })
            } else {
              nm.refresh();
              return signDay(nm, url);
            }
          }).catch(err => {
            nm.refresh();
            return signDay(nm, url);
          });
      } else {
        return signWeek(nm);
      }
    })
}


function start(entry) {
  const nm = Nightmare({
      show: process.env.show
  });
  return signDay(nm, entry.sign_url);
}

exports.start = start;
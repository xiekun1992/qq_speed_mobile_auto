const Nightmare = require('nightmare');


// 提取文本中出现的第一组数字
Nightmare.action('number', function (selector, done) {
  this.evaluate_now((selector) => {
    let el = document.querySelector(selector);
    if (el) {
        let text = el.innerText;
        let res = /(\-?\d*\.?\d+)/.exec(text);
        if (res && res.length > 0) {
          return +res[0];
        }
    } else {
        throw new Error(`.number() Unable to find element by selector: ${selector}`);
    }
    return NaN;
  }, done, selector);
});
// 点击最后一个元素
Nightmare.action('clickLast', function (selector, done) {
  this.evaluate_now((selector) => {
    const els = document.querySelectorAll(selector);
    if (els.length > 0) {
      let element = els[els.length - 1];
      let bounding = element.getBoundingClientRect();
      let event = new MouseEvent('click', {
        view: document.window,
        bubbles: true,
        cancelable: true,
        clientX: bounding.left + bounding.width / 2,
        clientY: bounding.top + bounding.height / 2
      });
      element.dispatchEvent(event);
    } else {
      throw new Error(`.checkList() Unable to find element by selector: ${selector}`);
    }
  }, done, selector);
});
// 移动端触摸按下
Nightmare.action('touch', function (selector, done) {
  this.evaluate_now((selector) => {
    const el = document.querySelector(selector);
    if (el) {
        let eventStart = new TouchEvent('touchstart');
        el.dispatchEvent(eventStart);
        let eventEnd = new TouchEvent('touchend');
        el.dispatchEvent(eventEnd);
    } else {
        throw new Error(`.touch() Unable to find element by selector: ${selector}`);
    }
  }, done, selector);
});
// 等到指定元素出现后或等待超时后再往下走
Nightmare.action('waitUntilVisible', function (selector, done) {
  let times = 18, leftTimes = times;
  const waitUntilVisible = () => {
    this.evaluate_now(selector => {
      const el = document.querySelectorAll(selector);
      let visible = false;
      if (el.length > 0){
        visible = true;
        for (let i = 0; i < el.length; i++) {
          if (el[i].getBoundingClientRect().width == 0 && el[i].getBoundingClientRect().height == 0) {
            visible = false;
            break;
          }
        }
      }
      return visible;
    }, (err, visible) => {
      if (err) return done(err);
      if (visible) return done(null, visible);
      if (leftTimes <= 0) {
        return done(new Error(`.waitUntilVisible() timeout for selector: ${selector}, after ${times} trials`));
      }
      leftTimes--;
      setTimeout(waitUntilVisible, 500);
    }, selector);
  }
  waitUntilVisible();
});
// 获取html元素的src属性
Nightmare.action('src', function (selector, done) {
  this.evaluate_now(selector => {
      let el = document.querySelector(selector);
      if (!el) {
        throw new Error(`.src() Unable to find element by selector: ${selector}`);
      }
      return el.src;
  }, done, selector);
});
Nightmare.action('hasClass', function (selector, className, done) {
  this.evaluate_now((selector, className) => {
    let el = document.querySelector(selector);
    if (!el) {
        throw new Error(`.hasClass() Unable to find element by selector: ${selector}`);
    }
    return el.classList.contains(className);
  }, done, selector, className);
});


Nightmare.action('loginFromQQMobileGameEntry', function (userInfo, done) {
    const waitUntilVisible = (selector) => {
        return new Promise((resolve, reject) => {
            let times = 18, leftTimes = times, timer;
            function checkElement() {
                clearTimeout(timer);
                const el = document.querySelectorAll(selector);
                let visible = false;
                if (el.length > 0){
                    visible = true;
                    for (let i = 0; i < el.length; i++) {
                        if (el[i].getBoundingClientRect().width == 0 && el[i].getBoundingClientRect().height == 0) {
                            visible = false;
                            break;
                        }
                    }
                }
                if (!visible) {
                    if (leftTimes <= 0) {
                        reject(new Error(`.waitUntilVisible() timeout for ${times} trials`));
                    }
                    leftTimes--;
                    timer = setTimeout(checkElement, 500);
                } else {
                    resolve(visible);
                }
            }
        });
    }
    this.evaluate_now(async userInfo => {
        await waitUntilVisible('#u') // account
        await type('#u', this.entry.account)
        await waitUntilVisible('#p') // password
        await type('#p', this.entry.password)
        await waitUntilVisible('#go') // login button
        await click('#go');
    }, done, userInfo);
    // .waitUntilVisible('#u') // account
    // .type('#u', this.entry.account)
    // .waitUntilVisible('#p') // password
    // .type('#p', this.entry.password)
    // .waitUntilVisible('#go') // login button
    // .click('#go')
});
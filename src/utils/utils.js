const Nightmare = require('nightmare');

Date.prototype.format = function formatDate() {
  const date = this;
  return `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, 0)}-${(date.getDate() + '').padStart(2, 0)} ${(date.getHours() + '').padStart(2, 0)}'${(date.getMinutes() + '').padStart(2, 0)}'${(date.getSeconds() + '').padStart(2, 0)}.${date.getMilliseconds()}`;
};


// 提取文本中出现的第一组数字
Nightmare.action('number', function (selector, done) {
  this.evaluate_now((selector) => {
    let text = document.querySelector(selector).innerText;
    let res = /(\-?\d*\.?\d+)/.exec(text);
    if (res && res.length > 0) {
      return +res[0];
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
      throw new Error('Unable to find element by selector: ' + selector);
    }
  }, done, selector);
});
// 移动端触摸按下
Nightmare.action('touch', function (selector, done) {
  this.evaluate_now((selector) => {
    const el = document.querySelector(selector);
    let event = new TouchEvent('touchstart');
    el.dispatchEvent(event);
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
        return done(new Error(`waitUntilVisible timeout for ${times} trials`));
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
    return document.querySelector(selector).src;
  }, done, selector);
});
// Nightmare.action('hasClass', (selector, done) => {
//   this.evaluate_now(selector => {

//   }, done, selector);
// });

module.exports = {};
const Nightmare = require('nightmare');

Nightmare.action('number', function (selector, done) {
  // 提取文本中出现的第一组数字
  this.evaluate_now((selector) => {
    let text = document.querySelector(selector).innerText;
    let res = /(\-?\d*\.?\d+)/.exec(text);
    if (res && res.length > 0) {
      return +res[0];
    }
    return NaN;
  }, done, selector);
});

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

// Nightmare.action('execUntilVisible', function (done) {
//   this.evaluate_now((selector) => {
//     let elem = document.querySelector(selector);
//     if (elem) {
//       if (elem.offsetWidth > 0 && elem.offsetHeight > 0) {//visible

//       }
//     } else { // invisible

//     }
//   }, done, selector);
// });


module.exports = {};
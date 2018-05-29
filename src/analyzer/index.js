const fs = require('fs');
const analyzer = require('./analyzer');
const logger = require('../utils/logger').getInstance();

// 定义超时
const limit = 5 * 60 * 1000;

function timeout(ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(function() {
      reject(`analyzer timeout, after ${limit}ms`);
    }, ms);
  });
}
function analyze(options) {
  return Promise
    .race([analyzer.analyze(), timeout(limit)])
    .then(token => {
      // 如果文件不存在将自动创建
      logger.info(token);
      fs.writeFileSync(options.tokenPath, `${token}\n`);
      return token;
    })
    .catch(err => {
      logger.error(err);
      throw new Error(err);
    });
}

module.exports = {
  analyze
}
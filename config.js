const fs = require('fs');

const entries = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

function parse(token) {
  token = token || fs.readFileSync(__dirname + '/token.txt');

  for (let entry of entries) {
    entry.account = Buffer.from(entry.account, 'base64').toString();
    entry.password = Buffer.from(entry.password, 'base64').toString();
    // 替换url中的token
    for (let url in entry) {
      if (url.includes('url')) {
        entry[url] = entry[url].replace(/uCMR7P8K/g, token);
      }
    }
  }
  return entries;
}

module.exports = {
  parse
}
const fs = require('fs');

function parse(token) {
  token = token || fs.readFileSync(__dirname + '/token.txt');
  const config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

  for (let entry of config.users) {
    entry.account = Buffer.from(entry.account, 'base64').toString();
    entry.password = Buffer.from(entry.password, 'base64').toString();
    // 替换url中的token
    for (let url in entry) {
      if (url.includes('url')) {
        entry[url] = entry[url].replace(/mU9XdAJS/g, token);
      }
    }
  }
  return config;
}

module.exports = {
  parse
}
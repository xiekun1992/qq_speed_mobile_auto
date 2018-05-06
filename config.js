const fs = require('fs');

const entries = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
for (let entry of entries) {
  entry.account = Buffer.from(entry.account, 'base64').toString();
  entry.password = Buffer.from(entry.password, 'base64').toString();
}

module.exports = {
  entries
}
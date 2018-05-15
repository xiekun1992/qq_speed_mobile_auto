const fs = require('fs');
let logPath = __dirname + '/log.log';

function setPath(path) {
    logPath = path;
}

function log(content) {
    fs.appendFileSync(logPath, `${new Date().format()} - ${content}`);
}

module.exports = {
    log,
    setPath
}
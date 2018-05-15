const fs = require('fs');
let logPath = __dirname + '/log.log';

function setPath(path) {
    logPath = path;
}
function log(content) {
    fs.appendFileSync(logPath, content);
}
function showAndLog(content) {
    content = `${new Date().format()} - ${content}\n`;
    console.log(content);
    log(content);
}

module.exports = {
    log,
    showAndLog,
    setPath
}
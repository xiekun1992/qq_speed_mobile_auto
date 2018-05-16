const fs = require('fs');
let logPath = __dirname;

function setPath(path) {
    logPath = path;
}
function log(content) {
    // 日志过大时需要创建新文件
    fs.appendFileSync(`${logPath}/log.log`, content);
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
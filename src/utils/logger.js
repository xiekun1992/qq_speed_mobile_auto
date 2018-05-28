const fs = require('fs');
let logPath = __dirname;
let template = '';

function setPath(path) {
    logPath = path;
}
function setTemplate(...tpls) {
    template = tpls.join(' - ');
}
function getInstance() {
    return new Logger();
}
class Logger {
    constructor() {
        this.template = '';
    }
    setTemplate(...args) {
        this.template = args.join(' - ');
    }
    log(content) {
        // 日志过大时需要创建新文件
        fs.appendFileSync(`${logPath}/log.log`, content);
    }
    showAndLog(type, content) {
        content = `${new Date().format()} - ${type} ${this.template} ${template} ${content}\n`;
        console.log(content);
        log(content);
    }
    error(content) {
        this.showAndLog('Error', JSON.stringify(content));
    }
    info(content) {
        this.showAndLog('Info', JSON.stringify(content));
    }
}


module.exports = {
    getInstance,
    setPath
}
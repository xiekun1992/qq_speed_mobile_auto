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
    showAndLog(type, content) {
        content = `${new Date().format()} - ${type} ${this.template} ${template} ${content}\n`;
        console.log(content);
        // 日志过大时需要创建新文件
        fs.appendFileSync(`${logPath}/log.log`, content);
    }
    error(content) {
        this.showAndLog('Error', typeof content !== 'string'? JSON.stringify(content): content);
    }
    info(content) {
        this.showAndLog('Info', typeof content !== 'string'? JSON.stringify(content): content);
    }
}


module.exports = {
    getInstance,
    setTemplate,
    setPath
}
const logger = require('./logger');

exports.TaskQueue = class TaskQueue {
    constructor({maxParallelTasks = 2, tasks = [], delay = 3600}) {
        this.tasks = tasks;
        this.runningTasks = [];
        this.maxParallelTasks = maxParallelTasks;
        this.delay = delay;
        this.name = this.constructor.name;
        this.addTasksPromise = null;
    }
    run() {
        this.roundTasks = this.tasks.slice(0); // 需要执行的一轮任务
        this.addTasksPromise = this.addTasks();
    }
    addTasks() { // 从这轮任务中获取任务
        return new Promise((resolve, reject) => {
            console.log(this)
            if (this.runningTasks.length < this.maxParallelTasks) {
                this.runningTasks = this.runningTasks.concat(this.roundTasks.splice(0, this.maxParallelTasks - this.runningTasks.length));
            }
            this.execTasks();
            resolve(true);
        });
    }
    removeTask(task) {
        this.runningTasks.splice(this.runningTasks.indexOf(task), 1);
    }
    execTasks() { // 开始执行当前需要执行的任务
        this.runningTasks.forEach((Task) => {
            Task.start()
            .then(res => {
                logger.showAndLog(`${this.name} >>> task finished successfully: ${res}`);
                if (typeof res === 'boolean' && res === true) {
                    this.removeTask(Task);
                    this.addTasksPromise = this.addTasksPromise.then(() => this.addTasks());
                }
            }).catch(err => {
                logger.showAndLog(`${this.name} >>> task fail with error: ${err}`);
                if (typeof res === 'boolean' && res === true) {
                    this.removeTask(Task);
                    this.addTasksPromise = this.addTasksPromise.then(() => this.addTasks());
                }
            });
        });
    }
    scheduleTask() { // 没有需要执行的任务时，自动计划下一轮任务的时间
        if (this.roundTasks.length === 0) {
            const timer = setTimeout(() => {
                this.run();
                clearTimeout(timer);
            }, this.delay * 1000);
        }
    }
}
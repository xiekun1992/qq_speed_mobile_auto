const logFactory = require('../utils/logger');
exports.TaskQueue = class TaskQueue {
    constructor({maxParallelTasks = 2, tasksFactory = function() {}, delay = 1}) {
        this.tasksFactory = tasksFactory;
        this.runningTasks = [];
        this.maxParallelTasks = maxParallelTasks;
        this.delay = delay;

        this.logger = logFactory.getInstance();
        this.logger.setTemplate(this.constructor.name);
        this.addTasksPromise = null;
        this.timer = null;
        this.windowCoord = [];
        this.windowCoord.length = this.maxParallelTasks;
    }
    run() {
        this.roundTasks = this.tasksFactory(); // 需要执行的一轮任务
        for (let task of this.roundTasks) {
            task.isRunning = false; // 记录当前任务的运行状态，避免重复运行
        }
        this.addTasksPromise = this.addTasks();
        return this;
    }
    addTasks() { // 从这轮任务中获取任务
        return new Promise((resolve, reject) => {
            if (this.runningTasks.length < this.maxParallelTasks) {
                this.runningTasks = this.runningTasks.concat(this.roundTasks.splice(0, this.maxParallelTasks - this.runningTasks.length));
            }
            this.execTasks();
            resolve(true);
        });
    }
    removeTask(task) {
        this.windowCoord[this.windowCoord.indexOf(task.entry.account)] = null;
        this.runningTasks.splice(this.runningTasks.indexOf(task), 1);
    }
    setWindowCoord(task) {
        let availPos = 0;
        console.log(this.windowCoord);
        for (let i = 0; i < this.windowCoord.length; i++) {
            if (!this.windowCoord[i]) {
                this.windowCoord[i] = task.entry.account;
                availPos = i;
                break;
            }
        }
        console.log(task.nm.options.x, task.nm.options.width, availPos)
        task.nm.options.x = task.nm.options.width * availPos;
    }
    execTasks() { // 开始执行当前需要执行的任务
        // !!!!!!!!!必须记录正在运行的任务，不能重复运行，由此可能导致用户名输入重复并且导致窗口坐标显示出错
        this.logger.info(`running tasks: ${this.runningTasks.length}`);
        this.logger.info(`round tasks: ${this.roundTasks.length}`);
        if (this.runningTasks.length > 0) {
            this.runningTasks.forEach((Task) => {
                if (!Task.isRunning) {
                    this.setWindowCoord(Task);
                    Task.isRunning = true;
                    Task.start()
                    .then(res => {
                        this.logger.info(`task finished successfully: ${res}`);
                        if (typeof res === 'boolean' && res === true) {
                            this.removeTask(Task);
                            this.addTasksPromise = this.addTasksPromise.then(() => this.addTasks());
                        }
                    }).catch(err => {
                        this.logger.error(`task fail with error: ${err}`);
                        if (typeof res === 'boolean' && res === true) {
                            this.removeTask(Task);
                            this.addTasksPromise = this.addTasksPromise.then(() => this.addTasks());
                        }
                    });
                }
            });
        } else {
            // 当前没有任务需要继续并且本轮任务都已经执行之后进入下一次调度
            if (this.roundTasks.length === 0) {
                this.scheduleTask();
            }
        }
    }
    scheduleTask() { // 没有需要执行的任务时，自动计划下一轮任务的时间
        this.windowCoord = [];
        this.windowCoord.length = this.maxParallelTasks;
        this.logger.info(`now the next turn will continue after ${this.delay}s`);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.run();
            clearTimeout(this.timer);
        }, this.delay * 1000);
    }
}
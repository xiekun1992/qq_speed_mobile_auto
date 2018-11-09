# qq_speed_mobile_auto

#### 掌上飞车长期任务自动完成
1. 疯狂猜猜乐
2. 周末趣飞车
3. 每日签到
4. 每日寻宝
5. 道聚城
6. 直播攒花

#### 依赖软件
- wireshark（tshark）
- android模拟器（网易mumu）
- 掌上飞车apk
#### 使用方式
1. 克隆本仓库代码到本地
2. 运行npm install
3. 手动添加config.json文件（定义任务的url、并行任务数、账号的信息）
4. 执行方式
    1. 不同机器运行
        1. 工作器
            - 运行npm start
        2. 分析器
            - 运行npm run analysis
    2. 同一台机器运行
        1. 运行npm run all

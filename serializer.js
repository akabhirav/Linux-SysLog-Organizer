const fs = require('fs');
const mongoose = require('mongoose');
// noinspection JSIgnoredPromiseFromCall
mongoose.connect('mongodb://localhost:27017/syslog', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = Promise;
mongoose.connection.on('error', (err) => {
    console.error(`An error occurred while connecting to mongo, ${err}`);
    process.exit(1);
});
const Schema = mongoose.Schema;
let SysLogSchema = new Schema({
    dateTime: Date,
    system: String,
    process: String,
    pid: Number,
    log: {type: String},
    type: {type: String, enum: ['ERROR', 'WARNING', 'STOP_UNLOAD', 'START_LOAD', 'INFO', 'KILLED', 'EXIT', 'AUDIT']},
    originalLogLine: String
});

const SysLog = mongoose.model('SysLog', SysLogSchema);

let logs = fs.readFileSync('/var/log/syslog', 'utf-8').split("\n");

try {
    SysLog.find().sort({dateTime: -1}).limit(1).exec((err, lastLog) => {
        if (lastLog)
            lastLog = lastLog[0];
        let currentCount = 0;
        let totalCount = logs.length;
        logs.forEach((log) => {
            let elements = log.split(' ');
            if (elements.length > 0) {
                let data = {};
                if (elements[4]) {
                    data.dateTime = new Date([elements[0], elements[1], (new Date).getFullYear(), elements[2]].join(' '));
                    if (lastLog && lastLog.dateTime >= data.dateTime){
                        currentCount += 1;
                        exitIfComplete(currentCount, totalCount);
                        return;
                    }

                    data.system = elements[3].replace(/'/g, '');
                    let [process, pid] = elements[4].replace(':', '').replace(']', '').split('[');
                    data.process = process;
                    data.pid = parseInt(pid) || 0;
                    data.log = '';
                    for (let i = 5; i < elements.length; i++) {
                        data.log = [data.log, elements[i]].join(' ');
                    }
                    setLogType(data);
                } else {
                    data.originalLogLine = log;
                }
                let sysLog = new SysLog(data);
                sysLog.save().then((log, err) => {
                    if (err) console.error('SAVE ERROR: ', err);
                    currentCount += 1;
                    exitIfComplete(currentCount, totalCount);
                });
            }
        });
    });
} catch (e) {
    console.log('ERROR: ', e);
}

let exitIfComplete = (currentProgress, totalCount) => {
    if (currentProgress === totalCount)
        process.exit(0);
};

let setLogType = (data) => {
    let log = data.log.toLowerCase();
    if (~log.indexOf('error') || ~log.indexOf('fail') || ~log.indexOf('(ee)'))
        data.type = 'ERROR';
    else if (~log.indexOf('warning') || ~log.indexOf('warning'))
        data.type = 'WARNING';
    else if (~log.indexOf('unloading') || ~log.indexOf('stop'))
        data.type = 'STOP_UNLOAD';
    else if (~log.indexOf('load') || ~log.indexOf('start'))
        data.type = 'START_LOAD';
    else if (~log.indexOf('info') || ~log.indexOf('(ii)'))
        data.type = 'INFO';
    else if (~log.indexOf('terminated'))
        data.type = 'KILLED';
    else if (~log.indexOf('exit'))
        data.type = 'EXIT';
    else if (~log.indexOf('audit'))
        data.type = 'AUDIT';
    else {
        data.originalLogLine = log;
        data.type = 'INFO';
    }
};
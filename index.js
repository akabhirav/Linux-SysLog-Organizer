const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/syslog');
mongoose.Promise = Promise;
mongoose.connection.on('error', (err) => {
  console.log(err);
  console.error("An error occurred while connecting to mongo");
  process.exit(1);
});
const Schema = mongoose.Schema;
let SysLogSchema = new Schema({
  dateTime: Date,
  system: String,
  process: String,
  pid: Number,
  log: {type: String},
  type: {type: String, enum: ['ERROR', 'WARNING', 'STOP_UNLOAD', 'START_LOAD', 'INFO', 'UNKNOWN']}
});

const SysLog = mongoose.model('SysLog', SysLogSchema);

let logs = fs.readFileSync('/var/log/syslog.1', 'utf-8').split("\n");

logs.forEach((line, index) => {
  let elements = line.split(' ');
  if (elements.length > 0) {
    let data = {};
    if (elements[4]) {
      data.dateTime = new Date([elements[0], elements[1], (new Date).getFullYear(), elements[2]].join(' '));
      data.system = elements[3].replace(/'/g, '');
      let [process, pid] = elements[4].replace(':', '').replace(']', '').split('[');
      data.process = process;
      data.pid = parseInt(pid) || 0;
      data.log = '';
      for (let i = 6; i < elements.length; i++) {
        data.log += elements[i];
      }
      const dataLog = data.log.toLowerCase();
      if (~dataLog.indexOf('error') || ~dataLog.indexOf('fail') || ~dataLog.indexOf('(ee)'))
        data.type = 'ERROR';
      else if (~dataLog.indexOf('warning'))
        data.type = 'WARNING';
      else if (~dataLog.indexOf('unloading') || ~dataLog.indexOf('stop'))
        data.type = 'STOP_UNLOAD';
      else if (~dataLog.indexOf('load') || ~dataLog.indexOf('start'))
        data.type = 'START_LOAD';
      else if (~dataLog.indexOf('info') || ~dataLog.indexOf('(ii)'))
        data.type = 'INFO';
      else
        data.type = 'UNKNOWN';
    }
    SysLog.find({
      "dateTime": data.dateTime,
      process: data.process,
      pid: data.pid,
      log: data.log
    }).exec((err, logs) => {
      if(err) console.error(err);
      let shouldWrite = logs.length === 0;
      console.log(logs.length);
      if(shouldWrite){
        let sysLog = new SysLog(data);
        sysLog.save((err, sysLog) => {
          if (err) console.error(err);
          if (index === logs.length - 1)
            process.exit();
        });
        console.info("Written", data.process, data.pid, data.dateTime)
      } else {
        console.info("Skipped", data.process, data.pid, data.dateTime)
      }
    });
  }
});

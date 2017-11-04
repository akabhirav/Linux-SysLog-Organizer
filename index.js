const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/syslog', {useMongoClient: true});
mongoose.connection.on('error', () => {
  console.error("An error occured while connecting to mongo");
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
    if(elements[4]){
      data.dateTime = new Date([elements[0], elements[2], (new Date).getFullYear(), elements[3]].join(' '));
      data.system = elements[4].replace(/'/g, '');
      let [process, pid] = elements[5].replace(':', '').replace(']', '').split('[');
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
    let sysLog = new SysLog(data);
    sysLog.save((err, sysLog) => {
      if (err) console.error(err);
      // console.log(sysLog);
      console.log(logs.length);
      if(index === logs.length - 1)
        process.exit();
    });
  }
});
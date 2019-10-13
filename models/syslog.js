const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SysLogSchema = new Schema({
    dateTime: Date,
    system: String,
    process: String,
    pid: Number,
    log: {type: String},
    type: {type: String, enum: ['ERROR', 'WARNING', 'STOP_UNLOAD', 'START_LOAD', 'INFO', 'KILLED', 'EXIT', 'AUDIT']},
    originalLogLine: String
});

module.exports = mongoose.model('SysLog', SysLogSchema);
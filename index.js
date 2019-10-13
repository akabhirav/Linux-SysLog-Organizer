const app = require('express')();
const port = process.env.PORT || 3000
const mongoose = require('./libs/mongoose_connection').getInstance();
const SysLog = require('./models/syslog');

// Server Logs
const morgan = require('morgan')
app.use(morgan('dev'))

app.get('/api/v1/getData.json', (req, res) => {
    let d = new Date();
    d.setMinutes(d.getMinutes() - 100)
    SysLog.find({dateTime: {$gt: d}}).exec((err, logs) => {
        res.json(JSON.stringify(logs));
    });
})

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname })
})

app.listen(port, () => {
    console.log(`Listening at PORT ${port}`);
})
const mongoose = require('mongoose');
let instance = null
class MongooseConnection {
    constructor(){
        console.log('Creating new Mongoose connection');
        // noinspection JSIgnoredPromiseFromCall
        mongoose.connect('mongodb://localhost:27017/syslog', {useNewUrlParser: true, useUnifiedTopology: true});
        mongoose.Promise = Promise;
        mongoose.connection.on('error', (err) => {
            console.error(`An error occurred while connecting to mongo, ${err}`);
            process.exit(1);
        });
        return mongoose;
    }

    static getInstance(){
        if(!instance)
            instance = new MongooseConnection();
        return mongoose;
    }
}

module.exports = MongooseConnection;
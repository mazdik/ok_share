'use strict';

var log4js = require('log4js');

log4js.configure({
    appenders: [
        { type: 'console' }, {
            type: 'file',
            filename: __dirname + "/logs/log.log",
            category: 'log',
            maxLogSize: 200480,
            backups: 2
        }, {
            type: 'file',
            filename: __dirname + "/logs/error.log",
            category: 'error',
            maxLogSize: 200480,
            backups: 2
        }, {
            type: "file",
            filename: __dirname + "/logs/info.log",
            category: 'info',
            maxLogSize: 200480,
            backups: 2
        }, {
            type: 'file',
            filename: __dirname + "/logs/debug.log",
            category: 'debug',
            maxLogSize: 200480,
            backups: 2
        }
    ]
});

let logger = log4js.getLogger('log');
logger.setLevel('DEBUG');

module.exports = logger;

'use strict';
var debug = require('debug')('plugin:envoy');
module.exports.init = function(config, logger, stats ) {
    return {
        onresponse: function(req, res, next) {
            req.headers['target_received_start_timestamp'] = Date.now();
            //calculate target-time
            debug('calculate target-time');
            res.setHeader('x-apigee-emg-target-time', (req.headers['target_received_start_timestamp'] - req.headers['target_sent_start_timestamp']));
            //set target-resp-recd
            res.setHeader('x-apigee-emg-target-resp-recd', req.headers['target_received_start_timestamp']);
            //set target-req-sent
            res.setHeader('x-apigee-emg-target-req-sent', req.headers['target_sent_start_timestamp']);
            next();
        },
        //error receiving client request
        onerror_request: function(req, res, err, next) {
            debug('onerror_request', err);
            res.setHeader('x-apigee-emg-target-req-sent', req.headers['target_sent_start_timestamp']);
            next();
        }
    };
    
}
var log     = require('fancy-log');
var fs      = require('fs-extra');


var checkCert = function() {
    return new Promise(function(resolve, reject) {
        log("Checking Root cert ... ");

        if(fs.existsSync('data/root.cert.pem')) {
            resolve();
        } else {
            reject("Root cert is not available.")
        }
    });
};


module.exports = {
    checkCert: checkCert
};

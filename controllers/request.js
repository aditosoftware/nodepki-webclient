var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')
var exec        = require('child_process').exec;
const uuidV4    = require('uuid/v4');
var fs          = require('fs-extra');


function fail() {

}


module.exports = function(req, res) {
    // Check auth state
    if(!req.session.auth || !req.session.auth.authed) {
        res.redirect(302, '/');
    }

    var page = {
        title: 'Request new certificate',
        content: {
            state: 'form'
        },
        auth: req.session.auth
    }

    // Create temporary dir
    var tempdir = 'tmp/' + uuidV4() + '/';
    fs.ensureDirSync(tempdir);

    // Wrapper Promise
    return new Promise(function(resolve, reject) {
        new Promise(function(resolve, reject) {
            if(req.body.submitted && req.body.submitted === 'submitted' && req.session.auth.authed) {
                page.content.state = 'submitted'

                // Quick! Create key, CSR and submit to server.
                // Then receive result, and display!

                // Gather data ...
                var requestdata;

                try {
                    requestdata = {
                        key: {
                            passphrase: req.body.key_passphrase
                        },
                        certificate: {
                            country: req.body.certificate_country,
                            state: req.body.certificate_state,
                            locality: req.body.certificate_locality,
                            organization: req.body.certificate_organization,
                            cname: req.body.certificate_cname,
                            lifetime: parseInt(req.body.certificate_lifetime)
                        }
                    }
                } catch(err) {
                    reject("Not enough data transmitted! Error: " + err)
                }


                console.log("Gathered data:")
                console.log(requestdata)

                // Create certificate key
                passparam = (requestdata.key.passphrase === '') ? '' : '-aes256 -passout pass:' + requestdata.key.passphrase;
                exec('openssl genrsa -out key.pem ' + passparam + ' 2048', {
                    cwd: tempdir
                }, function(error, stdout, stderr) {
                    if(!error) {
                        // Save the key in variable
                        page.content.key = fs.readFileSync(tempdir + 'key.pem')

                        // Create csr.
                        passparam = (requestdata.key.passphrase === '') ? '' : '-passin pass:' + requestdata.key.passphrase;
                        exec('openssl req -config ../../openssl.cnf -key key.pem -new -sha256 -out cert.csr ' + passparam + ' -subj "/C='+requestdata.certificate.country+'/ST='+requestdata.certificate.state+'/L='+requestdata.certificate.locality+'/O='+requestdata.certificate.organization+'/CN='+requestdata.certificate.cname+'"', {
                            cwd: tempdir
                        }, function(error, stdout, stderr) {
                            if(!error) {
                                // ready
                                csr = tempdir + 'cert.csr';
                                log("CSR created. Ready.");

                                // Send CSR to NodePKI server
                                // [ ... ]
                                var csr = fs.readFileSync(tempdir + 'cert.csr', 'utf8');

                                var pushdata = {
                                    data: {
                                        csr: csr,
                                        lifetime: requestdata.certificate.lifetime,
                                        type: 'server'
                                    },
                                    auth: {
                                        username: req.session.auth.username,
                                        password: req.session.auth.password
                                    }
                                }

                                /*
                                 * Load certificates via API request
                                 */

                                apiclient.request(global.apipath + '/certificate/request/', 'POST', pushdata ).then(function(response) {
                                    if(response.success && response.cert) {
                                        // Cert received from NodePKI server
                                        log("Cert created successfully.")

                                        page.content.cert = response.cert

                                        // Request intermediate certificate ... we'll display it as well
                                        apiclient.request(global.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'intermediate' } } ).then(function(response) {
                                            if(response.success && response.cert) {
                                                page.content.intermediatecert = response.cert
                                                resolve(page)
                                            } else {
                                                reject("Error while retrieving intermediate cert.")
                                            }
                                        })
                                        .catch(function(err) {
                                            reject("Error while making API call: ", err)
                                        });
                                    } else {
                                        reject("Failed to get certificate.")
                                    }
                                })
                                .catch(function(err) {
                                    reject("Error while making API call: ", err)
                                });
                            } else {
                                reject("Could not create .csr.");
                            }
                        });
                    } else {
                        reject("Could not create .csr.");
                    }
                });
            } else {
                /*
                 * Show form
                 */

                page.csr_defaults = global.config.csr_defaults
                resolve(page)
            }
        })
        .then(function(page) {
            page.success = true
            res.render('request', page)
            fs.removeSync(tempdir);
            resolve(page)
        })
        .catch(function(err) {
            page.success = false
            page.errormessage = err
            res.render('request', page)
            fs.removeSync(tempdir);
            reject(err)
        });
    });
};

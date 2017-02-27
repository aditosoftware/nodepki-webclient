var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')
var exec        = require('child_process').exec;
const uuidV4    = require('uuid/v4');
var fs          = require('fs-extra');

module.exports = function(req, res) {
    return new Promise(function(resolve, reject) {
        var page = {
            title: 'Request new certificate',
            content: {
                state: 'form'
            },
            auth: req.session.auth
        }

        if(req.body.submitted && req.body.submitted === 'submitted') {
            page.content.state = 'submitted'

            // Quick! Create key, CSR and submit to server.
            // Then receive result, and display!
            // Things are getting messy now. :-/

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
                        cname: req.body.certificate_cname
                    }
                }
            } catch(err) {
                reject("Not sufficient data transmitted! Error: " + err)
            }


            console.log("Gathered data:")
            console.log(requestdata)


            // Create temporary dir
            var tempdir = 'tmp/' + uuidV4() + '/';
            fs.ensureDirSync(tempdir);

            // Create certificate key
            passparam = (requestdata.key.passphrase === '') ? '' : '-aes256 -passout pass:' + requestdata.key.passphrase;
            exec('openssl genrsa -out key.pem ' + passparam + ' 2048', {
                cwd: tempdir
            }, function(error, stdout, stderr) {
                if(!error) {
                    // Save the key in var
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
                                    lifetime: 365,
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
                                    log("Cert created successfully.")

                                    page.content.cert = response.cert

                                    apiclient.request(global.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'intermediate' } } ).then(function(response) {
                                        if(response.success && response.cert) {
                                            page.content.intermediatecert = response.cert

                                            fs.removeSync(tempdir)
                                            resolve(page)
                                        } else {
                                            reject("Error while retrieving intermediate cert.")
                                        }
                                    })
                                    .catch(function(err) {
                                        fs.removeSync(tempdir);
                                        reject("Error while making API call: ", err)
                                    });
                                } else {
                                    fs.removeSync(tempdir);
                                    reject("Failed to get certificate")
                                }
                            })
                            .catch(function(err) {
                                fs.removeSync(tempdir);
                                reject("Error while making API call: ", err)
                            });
                        } else {
                            fs.removeSync(tempdir);
                            reject("Could not create .csr: " + error);
                        }
                    });
                } else {
                    fs.removeSync(tempdir);
                    reject("Could not create .csr: " + error);
                }
            });
        } else {
            /*
             * Show form
             */
            resolve(page)
        }
    });
};

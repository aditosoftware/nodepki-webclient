var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')
var exec        = require('child_process').exec;
const uuidV4    = require('uuid/v4');
var fs          = require('fs-extra');


module.exports = function(req, res) {
    // Wrapper Promise
    return new Promise(function(resolve, reject) {
        // Check auth state
        var page = {
            title: 'Request new certificate',
            content: {
                state: 'form'
            },
            auth: req.session.auth,
            baseurl: global.config.server.baseurl
        }




        new Promise(function(resolve, reject) {
            if(req.body.submitted && req.session.auth.authed) {
                page.content.state = 'submitted'
                var requestdata;

                // Create temporary dir
                var tempdir = 'tmp/' + uuidV4() + '/';
                fs.ensureDirSync(tempdir);

                new Promise(function(resolve, reject) {


                    if(req.body.submitted === 'submitted_easyform') {
                        // Quick! Create key, CSR and submit to server.
                        // Then receive result, and display!

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
                                    san: req.body.certificate_san,
                                    lifetime: parseInt(req.body.certificate_lifetime),
                                    type: req.body.certificate_type
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

                                // Is request for a client certificate or for a server certificate?
                                var opensslconf;
                                if(requestdata.certificate.type === 'client') {
                                    opensslconf = './../../openssl_client.cnf'
                                } else if(requestdata.certificate.type === 'server'){
                                    var template = fs.readFileSync('openssl_server.cnf', 'utf8')
                                    var conf = template + 'DNS.1 = ' + requestdata.certificate.cname + '\n'

                                    if(requestdata.certificate.san !== '') {
                                        // Loop through all altnames
                                        var altnames = requestdata.certificate.san.split('\n')
                                        altnames.forEach(function(altname, index, array) {
                                            conf += 'DNS.' + (index + 2) + ' = ' + altname + '\n'
                                        })
                                    }

                                    // Write new conf to file
                                    console.log(conf)

                                    fs.writeFileSync(tempdir + 'openssl.cnf', conf)
                                    opensslconf = 'openssl.cnf'
                                }


                                // Create csr.
                                passparam = (requestdata.key.passphrase === '') ? '' : '-passin pass:' + requestdata.key.passphrase;
                                exec('openssl req -config ' + opensslconf + ' -key key.pem -new -sha256 -out cert.csr ' + passparam + ' -subj "/C='+requestdata.certificate.country+'/ST='+requestdata.certificate.state+'/L='+requestdata.certificate.locality+'/O='+requestdata.certificate.organization+'/CN='+requestdata.certificate.cname+'"', {
                                    cwd: tempdir
                                }, function(error, stdout, stderr) {
                                    if(!error) {
                                        // ready
                                        var csr = fs.readFileSync(tempdir + 'cert.csr', 'utf8');
                                        log("CSR created. Ready.");

                                        resolve(csr)
                                    } else {
                                        reject("Could not create .csr.");
                                    }
                                });
                            } else {
                                reject("Could not create .csr.");
                            }
                        });
                    } else if (req.body.submitted === 'submitted_csr') {
                        // CSR was directly submitted

                        try {
                            requestdata = {
                                certificate: {
                                    lifetime: parseInt(req.body.certificate_lifetime)
                                }
                            }
                        } catch(err) {
                            reject("Not enough data transmitted! Error: " + err)
                        }

                        resolve(req.body.csr)
                    } else {
                        reject()
                    }
                })
                .then(function(csr) {
                    fs.removeSync(tempdir);

                    // Send CSR to NodePKI server
                    // [ ... ]
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
                })
                .catch(function(err) {
                    fs.removeSync(tempdir);
                    reject(err)
                })
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
            resolve(page)
        })
        .catch(function(err) {
            page.success = false
            page.errormessage = err
            res.render('request', page)
            reject(err)
        });
    });
};

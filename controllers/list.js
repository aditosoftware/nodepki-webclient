var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')


module.exports = function(req, res) {
    // Check auth state
    if(!req.session.auth || !req.session.auth.authed) {
        res.redirect(302, '/');
    }

    var page = {
        title: 'List of issued certificates',
        content: {},
        auth: req.session.auth
    }

    // Wrapper Promise
    return new Promise(function(resolve, reject) {
        new Promise(function(resolve, reject) {
            /*
             * Load certificates via API request
             */

            var pushdata = {
                data: {
                    state: 'all'
                },
                auth: {
                    username: req.session.auth.username,
                    password: req.session.auth.password
                }
            };

            apiclient.request(global.apipath + '/certificates/list/', 'POST', pushdata).then(function(response) {
                if(response.success && response.certs) {
                    // Cert received from NodePKI server
                    log("Received certificate list.")
                    page.content.certs = []

                    response.certs.forEach(function(cert) {
                        var expirationtime = (cert.expirationtime.slice(4,6)) + '.' + (cert.expirationtime.slice(2,4)) + '.' + '20' + (cert.expirationtime.slice(0,2))
                        var revocationtime = (cert.revocationtime !== '') ? (cert.expirationtime.slice(4,6)) + '.' + (cert.expirationtime.slice(2,4)) + '.' + '20' + (cert.expirationtime.slice(0,2)) : ''

                        var cert = {
                            serial: cert.serial,
                            expirationtime: expirationtime,
                            revocationtime: revocationtime,
                            subject: cert.subject,
                            download: '/getcert/?serial=' + cert.serial
                        }
                        page.content.certs.push(cert)
                    })

                    resolve();
                } else {
                    reject("Failed to get certificate.")
                }
            })
            .catch(function(err) {
                reject("Error while making API call: ", err)
            });
        })
        .then(function(page) {
            page.success = true
            res.render('list', page)
            resolve(page)
        })
        .catch(function(err) {
            page.success = false
            page.errormessage = err
            res.render('list', page)
            reject(err)
        });
    });
};

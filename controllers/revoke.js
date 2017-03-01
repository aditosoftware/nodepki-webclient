var apiclient           = require('./../apiclient.js')

module.exports = function(req, res) {
    var page = {
        title: "Revoke certificate",
        content: {},
        auth: req.session.auth,
        baseurl: global.config.server.baseurl
    }

    new Promise(function(resolve, reject) {
        if(req.param('serial') && req.param('serial') !== '') {
            page.sent = true
            var serial = req.param('serial');

            var postdata = {
                data: {
                    serialnumber: serial
                },
                auth: {
                    username: req.session.auth.username,
                    password: req.session.auth.password
                }
            };

            // Get certificate
            apiclient.request(global.apipath + '/certificate/get/', 'POST', postdata).then(function(response) {
                if(response.success && response.cert) {
                    certificate = response.cert

                    // Revoke
                    var postdata = {
                        data: {
                            cert: certificate
                        },
                        auth: {
                            username: req.session.auth.username,
                            password: req.session.auth.password
                        }
                    };

                    apiclient.request(global.apipath + '/certificate/revoke/', 'POST', postdata).then(function(response) {
                        if(response.success) {
                            resolve()
                        } else {
                            reject()
                        }
                    }).catch(function(err) {
                        reject()
                    })
                } else {
                    reject()
                }
            }).catch(function(err) {
                reject()
            })
        } else {
            // Display form
            resolve()
        }
    })
    .then(function() {
        page.success = true
        res.render('revoke', page)
    })
    .catch(function(err) {
        page.success = false
        page.errormessage = "Could not revoke certificate"
        res.render('revoke', page)
    })
}

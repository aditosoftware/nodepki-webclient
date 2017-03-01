var log = require('fancy-log')
var apiclient = require('./../apiclient.js')

module.exports = function(req, res) {
    // Check auth state
    if(!req.session.auth || !req.session.auth.authed) {
        res.redirect(302, '/');
    }

    var page = {
        title: "",
        baseurl: global.config.server.baseurl
    }

    var serial = req.param('serial')
    var certificate;

    return new Promise(function(resolve, reject) {
        new Promise(function(resolve, reject) {
            // Magic happens here.

            console.log("Requested certificate: " + serial)

            var postdata = {
                data: {
                    serialnumber: serial
                },
                auth: {
                    username: req.session.auth.username,
                    password: req.session.auth.password
                }
            };

            apiclient.request(global.apipath + '/certificate/get/', 'POST', postdata).then(function(response) {
                if(response.success && response.cert) {
                    certificate = response.cert
                }

                resolve()
            }).catch(function(err) {
                reject(err)
            })
        })
        .then(function() {
            // Set text header and trigger download of text data
            res.setHeader('Content-disposition', 'attachment; filename=' + serial + '.cert.pem');
            res.setHeader('Content-type', 'application/x-pem-file')
            res.end(certificate)
            resolve()
        })
        .catch(function(err) {
            // Set HTML header and display page
            page.success = false
            page.errormessage = "Certificate could not be received."
            res.render('getcert', page)
            reject(err)
        })
    })
}

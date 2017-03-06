var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')

module.exports = function(req, res) {
    var page = {
        title: 'CA certificates',
        content: {
            rootcert: "--- FAIL ---",
            intermediatecert: "--- FAIL ---"
        },
        auth: req.session.auth,
        baseurl: global.config.server.baseurl
    };

    return new Promise(function(resolve, reject) {
        new Promise(function(resolve, reject) {

            /*
             * Load certificates via API request
             */

            apiclient.request(global.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'root' } } ).then(function(response) {
                if(response.cert)
                    page.content.rootcert = response.cert

                apiclient.request(global.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'intermediate' } } ).then(function(response) {
                    if(response.cert)
                        page.content.intermediatecert = response.cert

                    resolve(page)
                })
                .catch(function(err) {
                    reject("Could not request intermediate certificate.", err)
                });
            })
            .catch(function(err) {
                reject("Could not request root certificate. ", err)
            });
        })
        .then(function(page) {
            var publicpath = (global.config.apiserver.tls ? 'https://' : 'http://') + global.config.apiserver.hostname + ':' + global.config.apiserver.publicport + '/public/'
            page.rootdownload = publicpath + 'ca/root/cert'
            page.intermediatedownload = publicpath + 'ca/intermediate/cert'

            page.success = true
            res.render('cacerts', page)
            resolve()
        })
        .catch(function(err) {
            page.success = false
            page.errormessage = err
            res.render('cacerts', page)
            reject(err)
        });
    });
};

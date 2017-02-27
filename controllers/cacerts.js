var log         = require('fancy-log')
var apiclient   = require('./../apiclient.js')

module.exports = function(req, res) {
    return new Promise(function(resolve, reject) {
        var page = {
            title: 'CA certificates',
            content: {
                rootcert: "--- FAIL ---",
                intermediatecert: "--- FAIL ---"
            },
            auth: req.session.auth
        };


        /*
         * Load certificates via API request
         */

        apiclient.request(global.config.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'root' } } ).then(function(response) {
            if(response.cert)
                page.content.rootcert = response.cert

            apiclient.request(global.config.apipath + '/ca/cert/get/', 'POST', { data: { ca: 'intermediate' } } ).then(function(response) {
                if(response.cert)
                    page.content.intermediatecert = response.cert

                resolve(page)
            })
            .catch(function(err) {
                reject("Error while making API call: ", err)
            });
        })
        .catch(function(err) {
            reject("Error while making API call: ", err)
        });
    });
};

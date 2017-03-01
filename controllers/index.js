var apiclient           = require('../apiclient.js')


module.exports = function(req, res) {
    return new Promise(function(resolve, reject) {
        var page = {
            title: 'Home',
            content: {},
            auth: req.session.auth,
            login: false,
            baseurl: global.config.server.baseurl
        };

        new Promise(function(resolve, reject) {
            var sess = req.session;

            // Make sure there is an auth object in the session

            if(!sess.auth)
                sess.auth = { authed: false }

            // If user tries to lo in
            if(req.body.username && req.body.password) {
                apiclient.request(global.apipath + '/auth/check/', 'POST', { auth: { username: req.body.username, password: req.body.password } } ).then(function(response) {
                    page.login = true

                    if(response.data.valid === true) {
                        page.success = true
                        sess.auth.authed = true
                        sess.auth.username = req.body.username
                        sess.auth.password = req.body.password
                    } else {
                        page.errormessage = "Login credentials invalid."
                    }

                    resolve(page)
                })
                .catch(function(err) {
                    reject("API request failed.")
                });
            } else {
                if(req.param('reqlogin') == '1'){
                    page.reqlogin = true
                }
                resolve(page)
            }
        })
        .then(function(page) {
            res.render('index', page)
            resolve()
        })
        .catch(function(err) {
            page.login = true
            page.success = false
            page.errormessage = err
            res.render('index', page)
            reject(err)
        })
    });
};

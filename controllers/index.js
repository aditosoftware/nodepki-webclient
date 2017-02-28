var apiclient           = require('../apiclient.js')


module.exports = function(req, res) {
    return new Promise(function(resolve, reject) {
        var page = {
            title: 'Home',
            content: {},
            auth: req.session.auth,
            login: false
        };

        new Promise(function(resolve, reject) {
            var sess = req.session;

            // Make sure there is an auth object in the session

            if(!sess.auth)
                sess.auth = {
                    authed: false
                }

            // If user tries to lo in
            if(req.body.username && req.body.password) {
                // Check credentials

                apiclient.request(global.apipath + '/auth/check/', 'POST', { auth: { username: req.body.username, password: req.body.password } } ).then(function(response) {
                    page.login = true
                    page.success = response.success;

                    if(response.success) {
                        sess.auth.authed = true
                        sess.auth.username = req.body.username
                        sess.auth.password = req.body.password
                    }

                    resolve(page)
                })
                .catch(function(err) {
                    reject("API request failed: ", err)
                });
            } else {
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

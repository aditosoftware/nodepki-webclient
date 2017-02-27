module.exports = function(req, res) {
    var page = {
        title: 'Home',
        content: {
            maintext: 'Hi.'
        },
        auth: req.session.auth
    };

    var sess = req.session;

    // Make sure there is an auth object in the session

    if(!sess.auth)
        sess.auth = {
            authed: false
        }

    if(req.body.username) {
        sess.auth.authed = true
        sess.auth.username = 'thomas'
        sess.auth.password = 'test'
    }

    return page;
};

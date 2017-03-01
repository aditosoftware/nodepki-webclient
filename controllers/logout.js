module.exports = function(req, res) {
    var sess = req.session;

    if(sess.auth)
        sess.auth.authed = false;

    res.redirect(302, global.baseurl + '/');
};

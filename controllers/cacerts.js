module.exports = function(req, res) {
    var page = {
        title: 'CA certificates',
        content: {
            rootcert: "--- hkjhfkgjhkjfdg ---",
            intermediatecert: "--- dfkjsjfhskjfhksjhdfkdf ---"
        },
        auth: req.session.auth
    };

    return page;
};

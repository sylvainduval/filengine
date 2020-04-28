var core = require('app/core');
var sess = require('api/includes/session');

function responseJSON(res, obj, status) {
		res.status(status);
		res.json(obj);

		return res;
}

function responseError(res, err, status) {
	if (typeof(status) == "undefined")
		status = 400;

	res.status(status);
	res.json({error: err});

	return res;
}

function responseInt(cb, err, data, code) {
	cb.call(this, err, data, code);
	return false;
}

module.exports = {

	getLibrary: function(req) {

		var mediaLibraryId = req;

		if (req.params.mediaLibraryId) {
			mediaLibraryId = req.params.mediaLibraryId;
		}

		let session = sess.getSession(req);

		if (session !== false) {
			for (var i in session.libraries) {

				if (session.libraries[i] == mediaLibraryId)
					return core.getLibrary(mediaLibraryId);
			}
		}

		return false;
	},

	responseJSON: responseJSON,
	responseError: responseError,
	responseInt: responseInt

}

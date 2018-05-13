var core = require('../../app/core');

var sess = require('../includes/session');


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

	ObjectID: function(str) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if (checkForHexRegExp.test(str)) {
			return str;
		}
		else
			return false;
	},

	stdListQuery: function(schema, params, cb) {

		params.offset = params.offset ? parseInt(params.offset) : 0;
		params.limit = params.limit ? parseInt(params.limit) : null;

		schema.count({}, function(err, count) {

			let query = schema.find({}).skip(params.offset).limit(params.limit);

			query.exec(function (err, r) {

				if (typeof(cb) == 'function') {
					cb.call(this, err, { success: true, total: count, data: r });
				}
			});
		});
	},

	responseJSON: responseJSON,
	responseError: responseError

}

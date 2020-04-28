var core = require('app/core');
var abstractModelService = require('services/abstractModel');
var Library = require('models/library');

module.exports = {
	getLibrary: function(session, mediaLibraryId, callback) {
		if (!session) {
			return false;
		}
		let find = {
			id: mediaLibraryId
		}
		if (abstractModelService.isObjectID(mediaLibraryId)) {
			find = {
				_id: mediaLibraryId
			}
		}
		Library.findOne(find, 'id', function(err, libraryDO) {
			if (err) {
				return c.responseError(res, err, 500);
			}
			for (var i in session.libraries) {
				if (libraryDO && session.libraries[i] == libraryDO.id) {
					return callback.call(this, core.getLibrary(libraryDO.id));
				}
			}
			throw 'Invalid Library ID';
		});
	}
}

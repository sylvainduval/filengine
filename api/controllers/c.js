var monk = require('monk');


module.exports = {
	
	setApp: function(ap) {
		this.app = ap;
	},
	
	getLibrary: function(req) {
		if (req.params.mediaLibraryId) {
			return this.app.getLibrary(req.params.mediaLibraryId);
		}
		return false;
	},

	collecFiles: function(mediaLibrary) {
		return this.app.db.get('lib_'+mediaLibrary.id+'_files');
	},
	
	
	collecDirs: function(mediaLibrary) {
		return this.app.db.get('lib_'+mediaLibrary.id+'_dirs');
	},

	ObjectID: function(str) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if (checkForHexRegExp.test(str)) {
			return monk.id(str)
		}
		else 
			return false;
	},
	
	responseJSON: function(res, obj, status) {
		res.status(status);
		res.json(obj);
		
		return res;
	},
	responseError: function(res, err) {
		res.status(400);
		res.json({error: err});
		
		return res;
	}

}
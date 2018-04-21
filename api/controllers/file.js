//Database
var mongo = require('mongodb');
var monk = require('monk');

//Filesystem
var fs = require('fs');

//utilitaires communs à tous les controlleurs
var c = require('./c');


exports.setApp = function(ap) {
	c.setApp(ap);
}

exports.get = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var id = c.ObjectID(req.params.fileId);
	if (c.checkAuth(req, res) == false) {
		return c.responseError(res, 'Invalid Token. Please login.');
	}
	
	if (mediaLib && id) {
		c.collecFiles(mediaLib).findOne({_id: id}).then((d) => {
			return c.responseJSON(res, d, 200);
		});
	}
	else {
		return c.responseError(res, 'invalid ID');
	}
	
}
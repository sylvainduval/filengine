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

exports.get_file = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var id = c.ObjectID(req.params.fileId);
	
	if (mediaLib && id) {
		c.collecFiles(mediaLib).findOne({_id: id}).then((d) => {
			res = c.responseJSON(res, d, 200);
		});
	}
	else {
		res = c.responseError(res, 'invalid ID');
	}
	
}

exports.test_post = function(req, res) {
	
	res.json(req.body);
}

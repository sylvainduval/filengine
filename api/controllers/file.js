
//Filesystem
var fs = require('fs');

var watcher = require('../../app/watcher.js');

//Models
var File = require('../../models/file'); // get our mongoose model
var Dir = require('../../models/dir');

//Gestionnaire de taches
var taskManager = require('../../app/taskmanager');


//utilitaires communs à tous les controlleurs
var c = require('../includes/common');

var core = require('../../app/core');


exports.get = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var id = c.ObjectID(req.params.fileId);

	if (mediaLib && id) {

		File.lib(mediaLib).findById(id)
		.populate({ path: 'path'})
	    .exec(function (err, d) {

			if (err)
				return c.responseError(res, err, 500);

			if (d == null)
				return c.responseError(res, 'invalid ID', 400);

			return c.responseJSON(res, {success: true, data: d}, 200);
		});
	}
	else {
		return c.responseError(res, 'invalid ID');
	}

}

exports.upload = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var idParent = c.ObjectID(req.params.parentId);

	var DS = core.config().directorySeparator;

	if (!req.files)
    	return c.responseError(res, 'No files were uploaded.', 400);


	Dir.lib(mediaLib).findById(idParent, function (err, d) {

		if (err)
			return c.responseError(res, err, 500);

		if (d == null)
			return c.responseError(res, 'Parent ID not found', 400);

		var dest = mediaLib.rootPath + DS + d.path + DS + d.name;

		let f = req.files.file;

		  // Use the mv() method to place the file somewhere on your server
		 f.mv(dest+DS+f.name, function(err) {

		    if (err)
		      return c.responseError(res, err, 500);

		    //On retourne la tâche du rescan du dossier
		    if (watcher.isWatched(mediaLib.id, d.inode)) {

				taskManager.get(mediaLib, 'scan', d.path + DS + d.name, function(task, err) {

					console.log('watched');
					if (err)
						return c.responseError(res, err, 500);

					return c.responseJSON(res, {success: true, data: task}, 201);
				});
			}
			else {

				taskManager.create({
					'type': 'scan',
					'mediaLibrary': mediaLib.id,
					'path': d.path + DS + d.name,
					'recurse': false,
					'priority': 4
				}, function(task, err) {

					if (err)
						return c.responseError(res, err, 500);

					return c.responseJSON(res, {success: true, data: task}, 201);
				});

			}


		  });

	});

}

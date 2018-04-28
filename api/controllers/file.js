//Database
var mongo = require('mongodb');
var monk = require('monk');

//Filesystem
var fs = require('fs');

var watcher = require('../../app/watcher.js');


//utilitaires communs à tous les controlleurs
var c = require('./c');

//var app;
/*exports.setApp = function(ap) {
	c.setApp(ap);
	//app = ap;
}*/

exports.get = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var id = c.ObjectID(req.params.fileId);
	
	if (mediaLib && id) {
		c.collecFiles(mediaLib).findOne({_id: id}).then((d) => {
			return c.responseJSON(res, d, 200);
		});
	}
	else {
		return c.responseError(res, 'invalid ID');
	}
	
}

exports.upload = function(req, res) {
	var mediaLib = c.getLibrary(req);
	var idParent = c.ObjectID(req.params.parentId);
	
	var DS = c.app().config.directorySeparator;
	
	if (!req.files)
    	return c.responseError(res, 'No files were uploaded.', 400);
		
	c.collecDirs(mediaLib).findOne({_id: idParent}).then((d) => {
		
		var dest = mediaLib.rootPath + DS + d.path + DS + d.name;
		
		let f = req.files.file;
 
		  // Use the mv() method to place the file somewhere on your server
		 f.mv(dest+DS+f.name, function(err) {
		    
		    if (err)
		      return c.responseError(res, err, 500);
		    
		    //On retourne la tâche du rescan du dossier
		    if (watcher.isWatched(c.app(), mediaLib.id, d.inode)) {
				c.app().task.get(c.app(), mediaLib, 'scan', d.path + DS + d.name, function(task, err) {
					if (err)
						return c.responseError(res, err, 500);
					
					return c.responseJSON(res, {success: true, task: task}, 200);
				});
			}
			else {
				
				c.app().task.create(c.app(), {
					'type': 'scan',
					'mediaLibrary': mediaLib.id,
					'path': d.path + DS + d.name,
					'recurse': false,
					'priority': 4
				}, function(task, err) {
					if (err)
						return c.responseError(res, err, 500);
					
					return c.responseJSON(res, {success: true, task: task}, 200);
				});

			}
		 
			  
		  });

	}).catch((err) => {
		return c.responseError(res, err, 500);
	});
	
	
	
	
}
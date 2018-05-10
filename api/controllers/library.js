
//Filesystem
var fs = require('fs');

var watcher = require('../../app/watcher.js');

//Models
var Library = require('../../models/library'); // get our mongoose model
var User = require('../../models/user');
var Task = require('../../models/task');
var File = require('../../models/file');
var Dir = require('../../models/dir');

//Gestionnaire de taches
var taskManager = require('../../app/taskmanager');


//utilitaires communs à tous les controlleurs
var c = require('../includes/common');

var core = require('../../app/core');


exports.get = function(req, res) {
	var mediaLib = c.getLibrary(req);
	
	if (c.getSession(req).libraries) {
		//Libraries autorisées pour l'utilisateur
		for (let j of c.getSession(req).libraries) {
	
			if (mediaLib.id == j) {
				
				if (!c.getSession(req).isAdmin)
					mediaLib.rootPath = undefined; // Inutile de divulguer ça à des non admin...
				
				return c.responseJSON(res, {success: true, data: mediaLib}, 200);
			}
		}
	}

	return c.responseError(res, 'invalid ID', 400);
}

exports.save = function(req, res) { //Mise à jour
	
	var setup = require('../../app/setup');
	
	var mediaLib = c.getLibrary(req);
	
	var update = {}
	
	if (mediaLib && mediaLib.active == false && (req.body.active == 'true') )
		console.log('A reactiver');
	
	update.fullScanDelay = req.body.fullScanDelay ? parseInt(req.body.fullScanDelay) : mediaLib.fullScanDelay;
	update.active = req.body.active ? (req.body.active == 'true')  : mediaLib.active;
	
	if (update.fullScanDelay == null)
		delete update.fullScanDelay;
		
	if (update.active == null)
		update.active = false;
	
	var id;
	
	if (mediaLib === false && c.getSession(req).isAdmin) {
		
		User.findOne({ _id: c.getSession(req).id}, function (err, data) {
			if (err) {
				return c.responseError(res, err, 500); 
			}
			
			if (data == null)
				return c.responseError(res, 'Not found', 400);
			
			if (data.libraries.indexOf(req.params.mediaLibraryId) != -1 || c.getSession(req).isSuperAdmin)
				id = req.params.mediaLibraryId;
			
			Library.findOneAndUpdate({ id: id},{ $set: update }, {new: true}, function (err, data) {
				if (err) {
					console.log(err);
					return c.responseError(res, err, 500); 
				}
				
				if (data == null)
					return c.responseError(res, 'Not found', 400);
					
					
				//Recharger la conf...
				core.loadLibraries(function() {
					
					if (data.active == true) {
						Dir.buildLibraries([data]);
						File.buildLibraries([data]);
						
						//Si la lib vient d'êtr ré-activée, il faudrait lancer un scan et le planifier...
						setup.createFirstScanTask(data);
					}
					
					return c.responseJSON(res, { success: true, data: data }, 200);
				});
				
			});
		});

	}
	else {
		id = mediaLib.id;

		Library.findOneAndUpdate({ id: id},{ $set: update }, {new: true}, function (err, data) {
			if (err) {
				console.log(err);
				return c.responseError(res, err, 500); 
			}
			
			if (data == null)
				return c.responseError(res, 'Not found', 400);
			
			if (data.active == false) {
				Task.remove({mediaLibrary : id, "processing" : false, "complete" : false}, function (err, data) {});
			}
			
			//Recharger la conf...
			core.loadLibraries(function() {
				
				return c.responseJSON(res, { success: true, data: data }, 200);
			});
		});

	}
}

exports.create = function(req, res) { //Création

	var setup = require('../../app/setup');

	var insert = {}
	
	insert.fullScanDelay = req.body.fullScanDelay ? parseInt(req.body.fullScanDelay) : 30;
	insert.active = req.body.active ? (req.body.active == 'true')  : true;
	insert.id = req.body.id ? req.body.id.trim() : false;
	
	if (!insert.id)
		return c.responseError(res, 'You must provide an ID', 400);
	
	if (!c.getSession(req).isAdmin)
		return c.responseError(res, 'Forbidden', 400);
		
	Library.findOne({ id: insert.id}, function (err, data) {
		if (err) {
			console.log(err);
			return c.responseError(res, err, 500); 
		}
		
		if (data != null)
			return c.responseError(res, 'ID already used', 400);
		
		insert.rootPath = core.config().pathForNewLibraries + core.config().directorySeparator + insert.id;
		
		//Clean // to /
		insert.rootPath = insert.rootPath.replace(core.config().directorySeparator + core.config().directorySeparator, core.config().directorySeparator);
		
		//Le dossier existe-t-il déjà ?
		if (fs.existsSync(insert.rootPath)) {
			var i = 1;
			while (fs.existsSync(insert.rootPath+'_'+i)) {
				i++;
			}
			insert.rootPath = insert.rootPath+'_'+i;
		}
		
		fs.mkdir(insert.rootPath, (err) => {
			if (err) 
				return c.responseError(res, 'Can\'t create directory', 500);
			
			var l = new Library(insert);
			
			l.save(function(err, data) {
				if (err)
					return c.responseError(res, err, 500);
					
				core.loadLibraries(function() {
					
					Dir.buildLibraries([data]);
					File.buildLibraries([data]);

					//il faut lancer un scan et le planifier...
					setup.createFirstScanTask(data);
				});
					
				//Il faut ajouter cette librairie à celles de l'utilisateur.
				User.findOne({ _id: c.getSession(req).id}, function (err, usr) {
					if (err) {
						return c.responseError(res, err, 500); 
					}
					
					var libs = usr.libraries;
					
					if (!usr.isSuperAdmin) { //Les superAdmin n'ont pas de libraries sur leur profil
						libs.push(insert.id);
					}
						
					User.findOneAndUpdate({ _id: usr._id},{ $set: {libraries: libs} }, function (err) {
						if (err) 
							return c.responseError(res, err, 500); 
							
						c.updateSessionData(c.getToken(req), {libraries: libs});

						return c.responseJSON(res, { success: true, data: data }, 200);
					});

				});

			});

		});
	});
}
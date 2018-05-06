//Database
//var mongo = require('mongodb');
//var monk = require('monk');
var fs = require('fs');

var File = require('../models/file'); // get our mongoose model
var Dir  = require('../models/dir');
var Task = require('../models/task');

//Gestionnaire de taches
var taskManager = require('./taskmanager');

var core = require('./core');

//Les watchers sont stockés dans watchers[mediaLibrary ID][]
var watchers = [];

function removeAll(mediaLibraryID) {

	var i = 0;

	if (watchers[mediaLibraryID]) {

		Object.keys(watchers[mediaLibraryID]).forEach(function (inode) {
		   watchers[mediaLibraryID][inode].close();
		   i++;
		});

		core.stdout(mediaLibraryID, 'Deleting '+ i +' previous watchers...');

		delete watchers[mediaLibraryID];
	}
}

function remove(mediaLibraryID, inode) {
	if (isWatched(mediaLibraryID, inode)) {
		watchers[mediaLibraryID][inode].close();
	}

}

function isWatched(mediaLibraryID, inode) {
	if (typeof(watchers[mediaLibraryID][inode]) != "undefined") {
		return true;
	}
}

function createScanTask(mediaLibrary, path, eventType, filename) {

	var t = {
		'type': 'scan',
		'mediaLibrary': mediaLibrary.id,
		'path': path,
		'recurse': false,
		'priority': 5,
		'processing' : false,
		'complete' : false
	}

	var DS = core.config().directorySeparator;


	if (eventType == 'rename') { // déplacement ou suppression
		var fullpath = mediaLibrary.rootPath + path + DS + filename;

		if (fs.existsSync(fullpath)) {
			var obj = fs.statSync(fullpath);

			var inode = obj.ino;

			if (path != '') {
				//On recherche le dossier parent du fichier path/name
				var lastIndex = path.lastIndexOf(DS);
				var ppath = path.substr(0, lastIndex);
				var pname = path.substr(lastIndex + 1);
			}
			else {
				var ppath = '';
				var pname = "__ROOT__";
			}

			if (obj.isFile() ) {
				//Rechercher dans collecDirs l'ID du dossier
				Dir.lib(mediaLibrary).findOne({path: ppath, name: pname}, function(err, di) {
					if (!err) {
						var parentId = di._id;
						File.lib(mediaLibrary).findOneAndUpdate({inode: inode}, {$set: {path: parentId}}, function(err, f) {
							if (!err) {
								if (f != null) //Le contraire peut arriver si l'élément arrive ici depuis un dossier non surveillé ou non répertorié
									core.stdout(mediaLibrary.id, 'Moved '+filename+' to '+ di.path + DS + di.name + ', Inode: '+obj.ino);
								else {
									Task.findOne(t, function(err, d) {
										if (!err && d == null) {
											taskManager.create(t);
										}
									});
								}
							}
						});

					}
				});
			}

			if (obj.isDirectory() ) {
				//Rechercher dans collecDirs l'ID du dossier parent
				Dir.lib(mediaLibrary).findOne({path: ppath, name: pname}, function (err, di) {
					var parentId = di._id;
					Dir.lib(mediaLibrary).findOneAndUpdate(
						{inode: inode},
						{$set: {parent: parentId, name:filename, path: ppath+DS+pname}},
						function (err, f) {
							if (!err) {
								if (f != null) //Le contraire peut arriver si l'élément arrive ici depuis un dossier non surveillé ou non répertorié
									core.stdout(mediaLibrary.id, 'Moved directory '+filename+' to '+ppath+DS+pname + ', Inode: '+obj.ino);
								else {
									t.recurse = true;
									Task.findOne(t, function(err, d) {
										if (!err && d == null) {
											taskManager.create(t);
										}
									});
								}
							}
						}
					);
				});
			}

		}
		else { //Emplacement d'origine qui n'existe plus, on scanne
			Task.findOne(t, function(err, d) {
				if (!err && d == null) {
					taskManager.create(t);
				}
			});

		}
	}
	else { //change

		Task.findOne(t, function (err, d) {
			if (!err && d == null) {
				taskManager.create(t);
			}
		});
	}
}

function addWatcher(mediaLibrary, path) {
	if (typeof(mediaLibrary) == 'string')
		mediaLibrary = core.getLibrary(mediaLibrary);

		var obj = fs.stat(mediaLibrary.rootPath + path, function(err, stats) {
		    if (err == null) {
			    watchers[mediaLibrary.id][stats.ino] = fs.watch(mediaLibrary.rootPath + path,function(typeOfEvent, nameOfFile){
					createScanTask(mediaLibrary, path, typeOfEvent, nameOfFile);
				});
			}
		});
}

function setWatchers(mediaLibrary) {
	core.stdout(mediaLibrary,  'Setting new watchers...');

	var DS = core.config().directorySeparator;

	if (mediaLibrary = core.getLibrary(mediaLibrary)) {

		watchers[mediaLibrary.id] = [];

		var rootPath = mediaLibrary.rootPath;

		Dir.lib(mediaLibrary).find(
			{},
			{},
			{ limit : mediaLibrary.watchers, sort : { modificationDate : -1 } },
			function (err, d) {
				if (!err) {
					for (var i in d) {
						var name = d[i].name == '__ROOT__' ? '' : DS + d[i].name;
						addWatcher(mediaLibrary, d[i].path + name);
					}
				}
				else
					throw err;
			}
		);

	}
}


module.exports = {
	removeAll: removeAll,
	setWatchers:setWatchers,
	addWatcher: addWatcher,
	isWatched: isWatched
}

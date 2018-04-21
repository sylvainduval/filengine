//Database
var mongo = require('mongodb');
var monk = require('monk');
var fs = require('fs');

//Les watchers sont dans app.watchers[mediaLibrary ID][]

function removeAll(app, mediaLibraryID) {

	var i = 0;
	
	if (app.watchers[mediaLibraryID]) {

		Object.keys(app.watchers[mediaLibraryID]).forEach(function (inode) {
		   app.watchers[mediaLibraryID][inode].close();
		   i++;
		});

		app.stdout(mediaLibraryID, 'Deleting '+ i +' previous watchers...');

		delete app.watchers[mediaLibraryID];
	}
}

function getLibrary(app, mediaLibrary) {
	for (var i in app.config.mediaLibraries) {
		if (app.config.mediaLibraries[i].id == mediaLibrary) {
			return app.config.mediaLibraries[i];
		}
	}
	return false;
}

function isWatched(app, mediaLibraryID, inode) {
	if (typeof(app.watchers[mediaLibraryID][inode]) != "undefined") {
		return true;
	}
}

function createScanTask(app, mediaLibrary, path, eventType, filename) {

	var t = {
		'type': 'scan',
		'mediaLibrary': mediaLibrary.id,
		'path': path,
		'recurse': false,
		'priority': 5,
		'processing' : false,
		'complete' : false
	}

	var DS = app.config.directorySeparator;


	if (eventType == 'rename') { // déplacement ou suppression
		var fullpath = mediaLibrary.rootPath + path + DS + filename;

		if (fs.existsSync(fullpath)) {
			var obj = fs.statSync(fullpath);

			var inode = obj.ino;
			var collecDirs = app.db.get('lib_'+mediaLibrary.id+'_dirs');
			var collecFiles = app.db.get('lib_'+mediaLibrary.id+'_files');

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
				collecDirs.findOne({path: ppath, name: pname}).then((di) => {
					var parentId = di._id;
					collecFiles.findOneAndUpdate({inode: inode}, {$set: {path: parentId}}).then((f) => {
						if (f != null) //Le contraire peut arriver si l'élément arrive ici depuis un dossier non surveillé ou non répertorié
							app.stdout(mediaLibrary.id, 'Moved '+filename+' to '+ di.path + DS + di.name + ', Inode: '+obj.ino);
						else {
							app.db.get('tasks').findOne(t).then((d) => {
								if (d == null) {
									app.task.create(app, t);
								}
							});	
						}
					});
				});
			}

			if (obj.isDirectory() ) {
				//Rechercher dans collecDirs l'ID du dossier parent
				collecDirs.findOne({path: ppath, name: pname}).then((di) => {
					var parentId = di._id;
					collecDirs.findOneAndUpdate({inode: inode}, {$set: {parent: parentId, name:filename, path: ppath+DS+pname}}).then((f) => {
						if (f != null) //Le contraire peut arriver si l'élément arrive ici depuis un dossier non surveillé ou non répertorié
							app.stdout(mediaLibrary.id, 'Moved directory '+filename+' to '+ppath+DS+pname + ', Inode: '+obj.ino);
						else {
							t.recurse = true;
							app.db.get('tasks').findOne(t).then((d) => {
								if (d == null) {
									app.task.create(app, t);	
								}
							});
						}
					});
				});
			}

		}
		else { //Emplacement d'origine qui n'existe plus, on scanne
			app.db.get('tasks').findOne(t).then((d) => {
				if (d == null) {
					app.task.create(app, t);
				}
			});

		}
	}
	else { //change


		app.db.get('tasks').findOne(t).then((d) => {
			if (d == null) {
				app.task.create(app, t);
			}
		});
	}
}

function addWatcher(app, mediaLibrary, path) {
	if (typeof(mediaLibrary) == 'string')
		mediaLibrary = getLibrary(app, mediaLibrary);

		var obj = fs.stat(mediaLibrary.rootPath + path, function(err, stats) {
		    if (err == null) {
			    app.watchers[mediaLibrary.id][stats.ino] = fs.watch(mediaLibrary.rootPath + path,function(typeOfEvent, nameOfFile){
					createScanTask(app, mediaLibrary, path, typeOfEvent, nameOfFile);
				});
			}
		});
}

function setWatchers(app, mediaLibrary) {
	app.stdout(mediaLibrary,  'Setting new watchers...');

	var DS = app.config.directorySeparator;

	if (mediaLibrary = getLibrary(app, mediaLibrary)) {

		app.watchers[mediaLibrary.id] = [];

		var rootPath = mediaLibrary.rootPath;

		var collecDirs = app.db.get('lib_'+mediaLibrary.id+'_dirs');

		collecDirs.find({}, { limit : mediaLibrary.watchers, sort : { modificationDate : -1 } }).then((d) => {
			for (var i in d) {
				var name = d[i].name == '__ROOT__' ? '' : DS + d[i].name;
				addWatcher(app, mediaLibrary, d[i].path + name);


			}
		});

	}
}


module.exports = {
	removeAll: removeAll,
	setWatchers:setWatchers,
	addWatcher: addWatcher
}

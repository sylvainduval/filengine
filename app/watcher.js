//Database
var mongo = require('mongodb');
var monk = require('monk');
var fs = require('fs');

//Les watchers sont dans app.watchers[mediaLibrary ID][]

function removeAll(app, mediaLibraryID) {

	if (app.watchers[mediaLibraryID] && app.watchers[mediaLibraryID].length > 0) {

		for (var i in app.watchers[mediaLibraryID]) {
			app.watchers[mediaLibraryID][i].close();
		}

		app.stdout(mediaLibraryID, 'Deleting '+ app.watchers[mediaLibraryID].length +' previous watchers...');

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
						if (f != null) //Le contraire ne doit pas arriver
							app.stdout(mediaLibrary.id, 'Moved '+filename+' to '+ di.path + DS + di.name + ', Inode: '+obj.ino);
					});
				});
			}

			if (obj.isDirectory() ) {
				//Rechercher dans collecDirs l'ID du dossier parent
				collecDirs.findOne({path: ppath, name: pname}).then((di) => {
					var parentId = di._id;
					collecDirs.findOneAndUpdate({inode: inode}, {$set: {parent: parentId, name:filename, path: ppath+DS+pname}}).then((f) => {
						if (f != null) //Le contraire ne doit pas arriver
							app.stdout(mediaLibrary.id, 'Moved directory '+filename+' to '+ppath+DS+pname + ', Inode: '+obj.ino);
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
	/*Problème avec les déplacements : le dossier d'origine est scanné, l'objet a disparu, il est retiré de la base... à revoir !*/
		app.watchers[mediaLibrary.id].push(fs.watch(mediaLibrary.rootPath + path, { encoding: 'buffer' }, (eventType, filename) => {
			createScanTask(app, mediaLibrary, path, eventType, filename);

		}));

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

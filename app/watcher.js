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

function createScanTask(app, mediaLibrary, path) {
	var t = {
		'type': 'scan',
		'mediaLibrary': mediaLibrary.id,
		'path': path,
		'recurse': false,
		'priority': 5,
		'processing' : false, 
		'complete' : false
	}
	
	app.db.get('tasks').findOne(t).then((d) => {
		if (d == null) {
			app.task.create(app, t);	
		}
	});
}

function addWatcher(app, mediaLibrary, path) {
	//Si le nombre d'écoutes actuelles a atteint le nombre maximum autorisé, on les redistribue.
	/*if (app.watchers[mediaLibrary.id].length -1 >= mediaLibrary.watchers) {
		removeAll(app, mediaLibrary.id);
		setWatchers(app, mediaLibrary.id);
	}
	else {*/
		app.watchers[mediaLibrary.id].push(fs.watch(mediaLibrary.rootPath + path, { encoding: 'buffer' }, (eventType, filename) => {
		  createScanTask(app, mediaLibrary, path);
		}));
	//}
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
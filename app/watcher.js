var fs = require('fs');

var chokidar = require('chokidar');

var File = require('models/file'); // get our mongoose model
var Dir  = require('models/dir');
var Task = require('models/task');

//Gestionnaire de taches
var taskManager = require('app/taskmanager');

var core = require('app/core');

//Les watchers sont stockés dans watchers[mediaLibrary ID][]
var watchers = [];

//Stocke provisoirement les chemins pour éviter les doubles appels du même évenement
var currentActions = [];

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
	return false;
}

function createScanTask(mediaLibrary, path, filename) {

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

							Task.findOne(t, function(err, d) {
								if (!err && d == null) {
									taskManager.create(t);
								}
							});

						}
					});

				}
			});
		}

		if (obj.isDirectory() ) {
			//Rechercher dans collecDirs l'ID du dossier parent
			Dir.lib(mediaLibrary).findOne({path: ppath, name: pname}, function (err, di) {
				if (di !== null) {
					var parentId = di._id;
					pname = pname == '__ROOT__' ? '' : DS+pname;

					Dir.lib(mediaLibrary).findOneAndUpdate(
						{inode: inode},
						{$set: {parent: parentId, name:filename, path: ppath+pname}},
						function (err, f) {
							if (!err) {

								addWatcher(mediaLibrary, ppath+pname+DS+filename);

								t.recurse = true;
								Task.findOne(t, function(err, d) {
									if (!err && d == null) {
										taskManager.create(t);
									}
								});

							}
						}
					);
				}
			});
		}
	}
	else {
		//Scanner le parent (Arrive en cas de suppression)
		var lastIndex = path.lastIndexOf(DS);
		var ppath = path.substr(0, lastIndex);
		var pname = path.substr(lastIndex + 1);

		createScanTask(mediaLibrary, ppath, pname);
	}

}

function addWatcher(mediaLibrary, path) {
	if (typeof(mediaLibrary) == 'string')
		mediaLibrary = core.getLibrary(mediaLibrary);

	var obj = fs.stat(mediaLibrary.rootPath + path, function(err, stats) {

		if (err == null && stats.ino ) {

			if (watchers[mediaLibrary.id][stats.ino] != undefined) {
				watchers[mediaLibrary.id][stats.ino].close();
			}

			try {

				watchers[mediaLibrary.id][stats.ino] = chokidar.watch(mediaLibrary.rootPath + path,
					{
						ignored: /(^|[\/\\])\../,
						//depth: 1,
						ignoreInitial: true,
						awaitWriteFinish: true /*{
							stabilityThreshold: 2000,
							pollInterval: 100
						}*/
					}
				)
				.on('all', (event, p) => {

					var now = (new Date()).getTime();

					for (let c of currentActions) {
						if ((c.path == p || (c.event == event && c.parent.indexOf( mediaLibrary.rootPath + path) !== -1)) && c.time > (now - 2100) )
							return false;
					}

					currentActions.push({event: event, path: p, parent: mediaLibrary.rootPath + path, time: now});

					createScanTask(mediaLibrary, p.substring(mediaLibrary.rootPath.length, p.length - core.basename(p, true).length -1), core.basename(p, true) );

					clearOldActions();

				});

			}
			catch(err) {
				core.stdout(mediaLibrary,  err);
			}
		}
	});
}

function setWatchers(mediaLibrary) {
	core.stdout(mediaLibrary, 'Setting new watchers...');

	var DS = core.config().directorySeparator;

	var nbWatchers = Math.round(core.config().watchers / core.config().mediaLibraries.length);

	if (mediaLibrary = core.getLibrary(mediaLibrary)) {

		watchers[mediaLibrary.id] = [];

		var rootPath = mediaLibrary.rootPath;

		Dir.lib(mediaLibrary).find(
			{},
			{},
			{ limit : nbWatchers, sort : { modificationDate : -1 } },
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

function clearOldActions() {
	var now = (new Date()).getTime();

	for (var i in currentActions) {
		if (currentActions[i].time < now - 20000) {
			currentActions.splice(i, 1);
		}
	}
}


module.exports = {
	removeAll: removeAll,
	setWatchers:setWatchers,
	addWatcher: addWatcher,
	isWatched: isWatched
}

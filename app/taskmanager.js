//Database
//var mongo = require('mongodb');
//var monk = require('monk');

var Task   = require('../models/task'); // get our mongoose model

var core = require('./core');
//Recherche d'une nouvelle tâche toutes les 2 secondes
//now = true (envoi immédiat) ou false (envoi après attente)


function execTask(now) {
	//Si aucune tache n'est en attente, on attend 2 secondes
	var delay = core.config().taskDelay;
	if (now == true) {
		delay = 100;
	}

	setTimeout(function() {
		launch();
	}, delay);
}

function create(params, callback) {

	if (!params.creationDate)
		params.creationDate = new Date();

	params.processing = false;
	params.complete = false;
	params.error = null;

	var t = new Task(params);

	t.save(function(err) {

		core.stdout(t.mediaLibrary, 'Creating new Task: ' + t.type + ', ID: '+ t._id);

		if (typeof(callback) == "function") {
			callback.call(this, t, null);

		}
	});
}

function launch() {

	Task.find({
		processing: true
	}, function (err, t) {

		if (t.length >= core.config().threads) {
			core.stdout(null,  'Busy, delaying new task...');
			execTask(false);
		}
		else {


			Task.findOneAndUpdate(
				{
					processing: false,
					complete: false,
					error: null,
					creationDate: {"$lte": new Date()}
				},
				{
					$set: { processing: true }
				},
				{
					sort: { priority: 1 }
				},
				function(err, doc) {

					if (doc == null || !doc.type) {
						execTask(false);
						return false;
					}


					switch (doc.type) {
						case 'fullscan' :
						case 'scan':

							//Module de scan
							var scan = require('./scan.js');

							if (doc.type == 'fullscan') {
								//Gestionnaire de taches
								var watcher = require('./watcher.js');
								watcher.removeAll(doc.mediaLibrary);
							}

							var s = new scan({
								mediaLibrary: doc.mediaLibrary
							});

							//Les compteurs continuent de s'incrémenter dans s...

							function checkCounterDir(s, doc) {
							    if (s.getCounter('counterDirs','done') < s.getCounter('counterDirs','scan')) {
							       setTimeout(function() {
								       checkCounterDir(s, doc);
								    }, 50);
							    } else {
							      core.stdout(doc.mediaLibrary,  'Directory indexation done');

							      core.stdout(doc.mediaLibrary,  'Starting file indexation...');

							      s.scanFiles(doc, doc.path);

							      checkCounterFiles(s, doc);
							    }
							}


							function checkCounterFiles(s, doc) {
								if (s.getCounter('counterFiles','done') < s.getCounter('counterFiles','scan')) {
									setTimeout(function() {
										checkCounterFiles(s, doc);
								    }, 50);
							    } else {
							      core.stdout(doc.mediaLibrary,  'File indexation done');

							      core.stdout(doc.mediaLibrary,  'Removing deleted elements...');

							      s.removeDeleted(doc, doc.path);

							      setTimeout(function() {
							     	 checkCounterRemove(s, doc);
							      }, 50);
							    }
							}

							function checkCounterRemove(s, doc) {
							    if (s.getCounter('counterRemove','done') < s.getCounter('counterRemove','scan')) {
							       setTimeout(function() {
								       checkCounterRemove(s, doc);
								    }, 50);
							    } else {
							      core.stdout(doc.mediaLibrary,  'Removing deleted elements done');
								  if (doc.type == 'fullscan') {
									  /*Problème avec les déplacements : le dossier d'origine est scanné, l'objet a disparu, il est retiré de la base... à revoir !*/
											watcher.setWatchers(doc.mediaLibrary);
							      }
							      end(doc);
							    }
							}

							core.stdout(doc.mediaLibrary,  'Starting directory '+doc.path+' indexation...');

							s.scanDir(doc, doc.path);

							checkCounterDir(s, doc);


						break;

					}

					execTask(true);
				}
			)
		}
	})
}

function end(obj) {
	Task.findOneAndUpdate(
		{_id: obj._id},
		{$set: { complete: true, processing: false }},
		function(err) {
			core.stdout(obj.mediaLibrary, 'Finishing Task: ' + obj.type + ', ID: '+ obj._id);

			if (obj.next) {

				//On recherche si une tâche identique n'est pas déjà planifiée
				Task.findOne({
					processing: false,
					complete: false,
					//error: null,
					type: obj.type,
					mediaLibrary: obj.mediaLibrary,
					next: obj.next
				},
				function(err, t) {
					if (t == null) {

						create({
							'type': 'fullscan',
							'mediaLibrary': obj.mediaLibrary,
							'creationDate': new Date(new Date().getTime() + obj.next*60000),
							'path': '', //Vide pour la racine
							'recurse': true,
							'priority': 4,
							'next': obj.next
						}, function(obj) {
							core.stdout(obj.mediaLibrary, 'Scheduling new Task: ' + obj.type + ', ID: '+ obj._id);
						});
					}
				});
			}

		}
	);
}

function flushComplete() {
	Task.remove({complete: true, error: null}, function(err) {
		if (!err)
			core.stdout(null, 'Flushing complete tasks');
	});
}

function cancel() {
	//Au démarrage de l'application, annule les tâches encore en cours.
	//Si elles ont des processus extérieurs, il faudrait les killer.
	Task.find({processing: true}, function(err, d) {
		if (d.length > 0) {
			core.stdout(null, 'Aborting '+d.length+' tasks');

			for (var t in d) {
				Task.findOneAndUpdate({_id: d[t]._id}, {$set: {complete: true, processing: false, error: 'Aborted'}}, function(err) {});	
			}
		}
	});
}

function get(mediaLibrary, type, path, callback) {

	Task.findOne(
		{ mediaLibrary: mediaLibrary.id, type: type, path: path },
		{},
		{ sort: { creationDate: -1 } },
		function(err, d) {
			console.log(err);
			if (!err)
				callback.call(this, d, null);
		}
	);

}

module.exports = {
	create: create,
	launch: launch,
	execTask: execTask,
	flushComplete: flushComplete,
	cancel: cancel,
	get: get

}

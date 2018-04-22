//Database
var mongo = require('mongodb');
var monk = require('monk');

//Filesystem
var fs = require('fs');

//API
var express = require('express'), 
		api = express();

var app = {
	
	//Configuration des mediathèques
	config: JSON.parse(fs.readFileSync('config.json')),
	
	//Gestionnaire de taches
	task: require('./app/task.js'),
	
	watchers: [],
	
	routes: null,

	
	//Recherche d'une nouvelle tâche toutes les 2 secondes
	execTask: function() {
		setTimeout(function() {
			app.task.launch(app);
		}, 1500);
	},

	init: function() {
		
		app.stdout(null,'------------------------------------------------------------');
		app.stdout(null,'*********** STARTING FILENGINE...... Ignition! *************');
		app.stdout(null,'------------------------------------------------------------');
		
		//Connexion à la base mongo
		app.db = monk(app.config.db);
		
		var tasks = app.db.get('tasks');
		
		//Abandon de toutes les tâches en cours
		app.task.cancel(app, tasks);
		
		//Suppression de toutes les tâches terminées
		app.task.flushComplete(app, tasks);
		
		
		
		for (var i in app.config.mediaLibraries) {
			//Il faut d'abord rechercher si il n'a pas déjà cette tâche en attente...
			this.createFirstScanTask(tasks, app.config.mediaLibraries[i]);
		}
	
		app.execTask();

		//Démarrage API
		api.listen(app.config.apiPort);
		app.stdout(null, "API listening on port: "+app.config.apiPort);
		
		/*api.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});*/
		
		app.routes = require('./api/routes/routes');
		app.routes(app, api);
		
	},
	
	createFirstScanTask: function(tasks, mediaLibrary) {

		tasks.findOne({
			processing: false,
			complete: false,
			type: 'fullscan',
			path: '',
			mediaLibrary: mediaLibrary.id,
		}).then((t) => {
			if (t == null) {
				app.task.create(app, {
					'type': 'fullscan',
					'mediaLibrary': mediaLibrary.id,
					'path': '', //Vide pour la racine
					'recurse': true,
					'priority': 4,
					'next': mediaLibrary.fullScanDelay
				});
			}
			else {
				//Mettre à jour avec le nouveau delai s'il a changé et exécuter maintenant
				tasks.update({_id: t._id}, {$set: {next: mediaLibrary.fullScanDelay, creationDate: new Date("June 28, 1979 09:15:00") }});
			}
		});
	},
	
	getLibrary: function(mediaLibrary) {
		for (var i in this.config.mediaLibraries) {
			if (this.config.mediaLibraries[i].id == mediaLibrary) {
				return this.config.mediaLibraries[i];
			}
		}
		return false;
	},
	
	//Sortie d'un message
	stdout: function(mediaLibrary, msg) {
		if (app.config.verbose == false)
			return false;
		
		var str = new Date().toISOString() + ' | ';
		if (mediaLibrary != null) {
			str += mediaLibrary + ' | ';
		}
		str += msg;
			
		console.log(str);
	}
	
	
}

app.init();
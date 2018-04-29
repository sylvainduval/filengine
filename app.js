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
	config: {},
	
	//Gestionnaire de taches
	task: require('./app/task.js'),
	
	watchers: [],
	
	routes: null,
	
	loadConfig: function(cb) {
		
		fs.readFile('config.json', 'utf8', function (err,data) {
		  if (err) {
			  console.log(err);
			  process.exit();
		  }

		  app.config = JSON.parse(data);
		  
		  if (typeof(cb) == 'function')
		  	cb.call(this);
		});
	},
	
	//Recherche d'une nouvelle tâche toutes les 2 secondes
	//now = true (envoi immédiat) ou false (envoi après attente)
	execTask: function(now) {
		//Si aucune tache n'est en attente, on attend 2 secondes
		var delay = app.config.taskDelay;
		if (now == true) {
			delay = 100;	
		}
		
		setTimeout(function() {
			app.task.launch(app);
		}, delay);
	},

	init: function() {
		
		app.loadConfig(function() {

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
				app.createFirstScanTask(tasks, app.config.mediaLibraries[i]);
			}
		
			app.execTask(true);
	
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
			
		});	
	},
	
	createFirstScanTask: function(tasks, mediaLibrary) {

		tasks.findOne({
			processing: false,
			complete: false,
			type: 'fullscan',
			//error: null,
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
//Database
var mongo = require('mongodb');
var monk = require('monk');



//Filesystem
var fs = require('fs');

var app = {
	
	//Configuration des mediathèques
	config: JSON.parse(fs.readFileSync('config.json')),
	
	//Gestionnaire de taches
	task: require('./app/task.js'),
	
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
		
		//Suppression de toutes les tâches terminées
		app.task.flushComplete(app);
		
		
		for (var i in app.config.mediaLibraries) {
			
			app.task.create(app, {
				'type': 'fullscan',
				'mediaLibrary': app.config.mediaLibraries[i].id,
				'path': '', //Vide pour la racine
				'recurse': true,
				'priority': 5,
				'next': app.config.mediaLibraries[i].fullScanDelay
			});
		}
		

			
		app.execTask();

		
		
		
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
var Task = require('models/task');
var User = require('models/user');

//Gestionnaire de taches
var taskManager = require('app/taskmanager');

//Routes
var routes = require('api/routes/routes');

//Sessions
var sess = require('api/includes/session');

var core = require('app/core');


function createFirstScanTask(mediaLibrary) {

    Task.findOne({
        processing: false,
        complete: false,
        type: 'fullscan',
        //error: null,
        path: '',
        mediaLibrary: mediaLibrary.id
    }, function(err, t) {

        if (t == null) {
            taskManager.create({
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
            Task.findOneAndUpdate(
                {_id: t._id},
                {$set: {
                    next: mediaLibrary.fullScanDelay,
                    creationDate: new Date("June 28, 1979 09:15:00")
                    }
                }, function(err, doc){

                }
            );
        }
    });
}

function createFirstApiUser() {
    User.findOne({login: 'admin'}, function(err, u) {
        if (!err && u == null) {

            var usr = new User({
                login: "admin",
                email: "admin@admin.com",
                password: "$2a$08$JuRqBV75ZXt9O6pH0UPRve3BULB/VIeFw64o5SLpskJvLmfXLzfCa",
                isAdmin: true,
                isSuperAdmin: true,
                deleted: false
            });

            usr.save(function(err) {});
        }
    });
}

function init() {

	core.loadConfig(function() {

		core.stdout(null,'------------------------------------------------------------');
		core.stdout(null,'*********** STARTING FILENGINE...... Ignition! *************');
		core.stdout(null,'------------------------------------------------------------');

		createFirstApiUser();

	    //Abandon de toutes les tâches en cours
	    taskManager.cancel();
	//Routes
var routes = require('api/routes/routes');
	    //Suppression de toutes les tâches terminées
	    taskManager.flushComplete();


		for (var i in core.config().mediaLibraries) {
			//Il faut d'abord rechercher si il n'a pas déjà cette tâche en attente...
			//if (core.config().mediaLibraries[i].active)
				createFirstScanTask(core.config().mediaLibraries[i]);
		}

		if (core.config().mediaLibraries.length == 0) {
			core.stdout(null,'No libraries found. Please add one with API');
		}

		taskManager.execTask(true);

		routes();

		//Restauration des précédentes sessions
		sess.restoreSessionDB();
	});

}

module.exports = {
	createFirstScanTask: createFirstScanTask,
	init: init
}

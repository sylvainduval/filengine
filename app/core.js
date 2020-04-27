require('dotenv').config();
var mongoose = require('mongoose');

//Filesystem
var fs = require('fs');

//Gestionnaire de taches
var taskManager = require('./taskmanager');

//Models
var File = require('../models/file'); // get our mongoose model
var Dir  = require('../models/dir');
var Libraries  = require('../models/library');

//Chargement de la configuration
var config = {}

function loadConfig(cb) {
	config = {
		apiPort: process.env.API_PORT,
		apiSessionValidity: process.env.API_SESSION_VALIDITY,
		db: process.env.DB,
		directorySeparator: process.env.DIRECTORY_SEPARATOR,
		verbose: process.env.VERBOSE,
		threads: process.env.THREADS,
		taskDelay: process.env.TASK_DELAY,
		watchers: process.env.WATCHERS,
		secretKey: process.env.SECRET_KEY,
		pathForNewLibraries: process.env.PATH_FOR_NEW_LIBRARIES
	}
	mongoose.connect(config.db, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	}); // connect to database


		loadLibraries(function() {

			File.buildLibraries(config.mediaLibraries);
			Dir.buildLibraries(config.mediaLibraries);

			if (typeof(cb) == 'function')
				cb.call(this);
		});
}

function loadLibraries(cb) {

	Libraries.find({active: true}, function(err, d) {

		if (err) {
			throw err;
			return false;
		}

		config.mediaLibraries = [];

		for (let l of d) {
			config.mediaLibraries.push(l);
		}

		if (typeof(cb) == 'function')
			cb.call(this);
	});
}

function getLibrary(mediaLibrary) {
	for (var i in config.mediaLibraries) {
		if (config.mediaLibraries[i].id == mediaLibrary || config.mediaLibraries[i]._id.toString() == mediaLibrary) {
			return config.mediaLibraries[i];
		}
	}
	return false;
}


function baseName(str, keepExtension) {
	var base = new String(str).substring(str.lastIndexOf(config.directorySeparator) + 1);
	if (keepExtension == false && base.lastIndexOf(".") != -1)
		base = base.substring(0, base.lastIndexOf("."));
	return base;
}

//Sortie d'un message
function stdout(mediaLibrary, msg) {

	if (config.verbose == false)
		return false;

	var str = new Date().toISOString() + ' | ';
	if (mediaLibrary != null) {
		str += mediaLibrary + ' | ';
	}
	str += msg;

	console.log(str);
}


module.exports = {
	loadConfig: loadConfig,
	loadLibraries: loadLibraries,
    stdout: stdout,
    config: function() {return config},
	getLibrary: getLibrary,
	basename: baseName
}

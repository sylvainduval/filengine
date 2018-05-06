var mongoose = require('mongoose');


//Filesystem
var fs = require('fs');

//Gestionnaire de taches
var taskManager = require('./taskmanager');

//Models
var File = require('../models/file'); // get our mongoose model
var Dir  = require('../models/dir');

//Chargement de la configuration
var config = {}

function loadConfig(cb) {

	fs.readFile('config.json', 'utf8', function (err, data) {
		if (err) {
		  console.log(err);
		  process.exit();
		}
		
		

		config = JSON.parse(data);

		mongoose.connect(config.db); // connect to database

		File.buildLibraries(config.mediaLibraries);
		Dir.buildLibraries(config.mediaLibraries);

		if (typeof(cb) == 'function')
			cb.call(this);
		}
	);
}

function getLibrary(mediaLibrary) {
	for (var i in config.mediaLibraries) {
		if (config.mediaLibraries[i].id == mediaLibrary) {
			return config.mediaLibraries[i];
		}
	}
	return false;
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
    stdout: stdout,
    config: function() {return config},
	getLibrary: getLibrary
}

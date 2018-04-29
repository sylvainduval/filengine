var monk = require('monk');

//Authentification
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

var app;

function setApp(ap) {
	app = ap;
}

//Données des sessions courantes. Ex : librairies autorisées.
var sessions = [];

function extendSession(token) {
	var n = Math.round(Date.now() / 1000);
	if (sessions[token]) {
		sessions[token].expire = n + app.config.apiSessionValidity;
		return true;
	}
	else
		return false;
}

function checkSessionValidity(token) {
	var n = Math.round(Date.now() / 1000);

	if (sessions[token] && sessions[token].expire > n) {
		return true;
	}
	else
		return false;
}

function responseJSON(res, obj, status) {

		res.status(status);
		res.json(obj);

		return res;
}

function responseError(res, err, status) {
	if (typeof(status) == "undefined")
		status = 400;

	res.status(status);
	res.json({error: err});

	return res;
}

function storeSession (token, data) {
	var n = Math.round(Date.now() / 1000);

	sessions[token] = {
		expire: (n + app.config.apiSessionValidity),
		data: data //libraries, login...
	}


	//Nettoyage des sessions expirées
	for (var i in sessions) {
		if (sessions[i].expire < n)
			delete sessions[i];
	}
}


module.exports = {

	setApp: setApp,

	app: function() {
		return app;
	},

	storeSession: storeSession,

	getLibrary: function(req) {

		var mediaLibraryId = req;

		if (req.params.mediaLibraryId) {
			mediaLibraryId = req.params.mediaLibraryId;
		}

			var token = req.headers['x-access-token'];

			if (sessions[token]) {
				for (var i in sessions[token].data.libraries) {

					if (sessions[token].data.libraries[i] == mediaLibraryId)
						return app.getLibrary(mediaLibraryId);
				}
			}


		return false;
	},

	collecFiles: function(mediaLibrary) {
		return app.db.get('lib_'+mediaLibrary.id+'_files');
	},


	collecDirs: function(mediaLibrary) {
		return app.db.get('lib_'+mediaLibrary.id+'_dirs');
	},

	collecUsers: function() {
		return app.db.get('users');
	},

	ObjectID: function(str) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if (checkForHexRegExp.test(str)) {
			return monk.id(str)
		}
		else
			return false;
	},

	checkAuth: function(req, res) {
		var token = req.headers['x-access-token'];
		if (!token)
			return false; //res.status(401).send({ auth: false, message: 'No token provided.' });

		return jwt.verify(token, app.config.secretKey, function(err, decoded) {
		    if (err)
		    	return false;/*res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

		    res.status(200).send(decoded);*/
		    else {
			    if (checkSessionValidity(token)) {

				    //Il faut rafraichir le token prolongé...
				    extendSession(token);
			    	return true;
		    	}
		    	else {
			    	//Session expired
			    	return false;
			    }

		    }
		});

	},

	responseJSON: responseJSON,
	responseError: responseError

}


//Authentification
var jwt = require('jsonwebtoken');
//var bcrypt = require('bcryptjs');

var core = require('../../app/core');


//Données des sessions courantes. Ex : librairies autorisées.
var sessions = [];

function extendSession(token) {
	var n = Math.round(Date.now() / 1000);
	if (sessions[token]) {
		sessions[token].expire = n + core.config().apiSessionValidity;
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
		expire: (n + core.config().apiSessionValidity),
		data: data //libraries, login...
	}


	//Nettoyage des sessions expirées
	for (var i in sessions) {
		if (sessions[i].expire < n)
			delete sessions[i];
	}
}

function getSession(req) {
	var token = req.headers['x-access-token'];
	
	if (sessions[token]) 
		return sessions[token].data;
	else
		return false;
}

module.exports = {

	storeSession: storeSession,
	
	getSession: getSession, 

	getLibrary: function(req) {

		var mediaLibraryId = req;

		if (req.params.mediaLibraryId) {
			mediaLibraryId = req.params.mediaLibraryId;
		}

			var token = req.headers['x-access-token'];

			if (sessions[token]) {
				for (var i in sessions[token].data.libraries) {

					if (sessions[token].data.libraries[i] == mediaLibraryId)
						return core.getLibrary(mediaLibraryId);
				}
			}


		return false;
	},

	ObjectID: function(str) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if (checkForHexRegExp.test(str)) {
			return str;
		}
		else
			return false;
	},

	checkAuth: function(req, res) {
		var token = req.headers['x-access-token'];
		if (!token)
			return false; //res.status(401).send({ auth: false, message: 'No token provided.' });

		return jwt.verify(token, core.config().secretKey, function(err, decoded) {
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

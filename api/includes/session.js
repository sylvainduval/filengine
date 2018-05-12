
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

function storeSession (token, data) {
	var n = Math.round(Date.now() / 1000);

	sessions[token] = {
		expire: (n + core.config().apiSessionValidity),
		data: data //libraries, login...
	}


	//Nettoyage des sessions expirées
	for (var i in sessions) {
		if (sessions[i] && sessions[i].expire < n)
			delete sessions[i];
	}
}

function updateSessionData(token, data) {
	if (sessions[token]) {
		for (var i in data) {
			sessions[token].data[i] = data[i]
		}
		return true;
	}	
	return false;
}

function getSession(req) {
	var token = req.headers['x-access-token'];
	
	if (sessions[token]) 
		return sessions[token].data;
	else
		return false;
}

function getToken(req) {
	if (req.headers['x-access-token']) 
		return req.headers['x-access-token'];
	else
		return false;
}

function deleteSession(token) {
	if (sessions[token]) {

		delete sessions[token] ;
		
		return true;
	}
	return false;
}

module.exports = {

	storeSession: storeSession,
	
	deleteSession: deleteSession,
	
	updateSessionData: updateSessionData,
	
	getSession: getSession, 
	
	getToken: getToken,
	
	checkSessionValidity: checkSessionValidity,

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

	}

}

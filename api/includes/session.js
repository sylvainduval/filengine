
//Authentification
var jwt = require('jsonwebtoken');
//var bcrypt = require('bcryptjs');

var core = require('../../app/core');
//Models
var Session = require('../../models/session'); // get our mongoose model

//Données des sessions courantes. Ex : librairies autorisées.
var sessions = [];

function extendSession(token) {
	var n = Math.round(Date.now() / 1000);
	if (sessions[token]) {
		sessions[token].expire = n + core.config().apiSessionValidity;

		saveSessionDB(token, sessions[token]);

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

	saveSessionDB(token, sessions[token]);

	//Nettoyage des sessions expirées
	for (var i in sessions) {
		if (sessions[i] && sessions[i].expire < n)
			delete sessions[i];
	}
	clearSessionDB();
}

function updateSessionData(token, data) {
	if (sessions[token]) {
		for (var i in data) {
			sessions[token].data[i] = data[i]
		}
		saveSessionDB(token, sessions[token]);
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

		delete sessions[token];

		deleteSessionDB(token);
		return true;
	}
	return false;
}


//OPTIONNEL : Enregistrement des sessions en base, pour restauration en cas de redémarrage de l'application
function saveSessionDB(token, data) {

	deleteSessionDB(token, function() {

		var s = new Session({
			token: token,
			expire: data.expire,
			data : data.data
		});
		s.save(function(err) {
			if(err) { core.stdout(null,err) }
		});

	});
}

function deleteSessionDB(token, cb) {
	Session.findOneAndRemove({token: token}, function (err){
		if(err) { core.stdout(null,err) }

		if (typeof(cb) == 'function')
			cb.call(this);
	});

}

//Supprime les sessions expirées en base
function clearSessionDB() {
	var n = Math.round(Date.now() / 1000);

	Session.deleteMany({expire: { $lt : n}}, function (err){
		if(err) { core.stdout(null,err) }
	});
}

//Restaure les sessions enregistrées après un redémarrage de l'application
function restoreSessionDB() {
	var n = Math.round(Date.now() / 1000);

	Session.find({expire: { $gt : n}}, function (err, sess){
		if(err) { core.stdout(null,err) }
		else {
			for (let s of sess) {
				sessions[s.token] = {
					expire: s.expire,
					data: s.data //libraries, login...
				}
			}

			core.stdout(null, 'Restoring '+ sess.length +' previous sessions...');
		}
	});
}

module.exports = {

	storeSession: storeSession,

	deleteSession: deleteSession,

	updateSessionData: updateSessionData,

	getSession: getSession,

	getToken: getToken,

	checkSessionValidity: checkSessionValidity,

	restoreSessionDB: restoreSessionDB,

	checkAuth: function(req, res) {
		var token = req.headers['x-access-token'];
		if (!token)
			return false; //res.status(401).send({ auth: false, message: 'No token provided.' });

		return jwt.verify(token, core.config().secretKey, function(err, decoded) {
		    if (err)
		    	return false;
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

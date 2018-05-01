//Database
var mongo = require('mongodb');
var monk = require('monk');

//Filesystem
var fs = require('fs');

//Authentification
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

//utilitaires communs à tous les controlleurs
var c = require('../includes/common');


// CREATES A NEW USER
exports.register = function(req, res) {
	var login = req.body.login ? req.body.login : false;
	var email = req.body.email ? req.body.email : false;
	var password = req.body.password ? req.body.password : false;

	if (!login || !email || !password) {
		return c.responseError(res, 'invalid parameters');
	}

	c.collecUsers().findOne({login: login}).then((u) => {
		if (u != null) {
			return c.responseError(res, 'Login already Used', 403);
		}

		var hashedPassword = bcrypt.hashSync(password, 8);

		c.collecUsers().insert({login: login, email: email, password: hashedPassword})
		.then((user) => {

			// create a token
			var token = jwt.sign({ id: user._id }, c.app().config.secretKey);

			c.storeSession(token, {
				libraries: [], // Il faudra les ajouter en 2e temps
				login: login
			});

			return c.responseJSON(res, { auth: true, token: token }, 201);
		}).catch((err) => {
			// An error happened while inserting
			return c.responseError(res, 'There was a problem registering the user.', 500);
		});
	});
}

//LOGIN
exports.login = function(req, res) {
	var login = req.body.login ? req.body.login : false;
	var password = req.body.password ? req.body.password : false;

	if (!login || !password) {
		return c.responseError(res, 'invalid parameters');
	}

	c.collecUsers().findOne({ login: login }).then((user) => {

		bcrypt.compare(password, user.password, function(err, isMatch) {
			
			if (isMatch == true) {

				var token = jwt.sign({ id: user._id }, c.app().config.secretKey);
				
				//Les super Admin ont droit à toutes les librairies
				if (user.isSuperAdmin) {
					user.libraries = [];
					for (var i in c.app().config.mediaLibraries)
						user.libraries.push(c.app().config.mediaLibraries[i].id);
				}

				c.storeSession(token, {
					id: user._id.toString(),
					libraries: user.libraries,
					login: login,
					isAdmin: user.isAdmin ? user.isAdmin : false,
					isSuperAdmin: user.isSuperAdmin ? user.isSuperAdmin : false
				});

				return c.responseJSON(res, { success: true, token: token }, 200);
			}
			else
				return c.responseError(res, 'Authentication failed. Wrong password.', 401);
		});

	}).catch((err) => {
		return c.responseError(res, 'Authentication failed. User not found.', 500);
	});

}


exports.getLibraries = function(req, res) {
	const id = c.ObjectID(req.params.userId);
	
	//Seul le user lui même ou un admin peut afficher les librairies d'un user
	if (c.getSession(req).isAdmin == false && c.getSession(req).id != id)
		return c.responseError(res, 'Forbidden', 403);

	c.collecUsers().findOne({ _id: id }).then((user) => {
		var r = [];
		for (var i in user.libraries) {
				r.push(c.app().getLibrary(user.libraries[i]));
		}
		return c.responseJSON(res, { success: true, data: r }, 200);

	}).catch((err) => {
		return c.responseError(res, 'Can\t find user '+id, 400);
	});

}

exports.setParams = function(req, res) {
	const id        = c.ObjectID(req.params.userId); //Gérer le droit....
	const libraries = req.body.libraries ? JSON.parse(decodeURIComponent(req.body.libraries)) : null;
	const isAdmin   = req.body.isAdmin   ? req.body.isAdmin : null;
	const email     = req.body.email && req.body.email != null       ? req.body.email : null;
	const password  = req.body.password && req.body.password != null ? bcrypt.hashSync(req.body.password, 8) : null;

	//Seul le user lui-même ou un admin peut éditer un user
	if (c.getSession(req).isAdmin == false && c.getSession(req).id != id)
		return c.responseError(res, 'Forbidden', 403);
		
	

	var update = {}

	if (libraries !== null && libraries.length > 0) {
		
		//Ce user doit lui-même avoir accès aux librairies qu'il veut autoriser, ou être super admin...
		var sessLib = c.getSession(req).libraries;
		
		for (var i in libraries) { //Nouvelles librairies demandées
			var found = false;
			
			for (var j in sessLib) {
				//Si i n'est pas trouvé dans j, on doit le retirer de i
				if (libraries[i] == sessLib[j])
					found = true;
			}
			if (found == false)
				libraries.splice(i, 1);
		}
		
		if (libraries.length > 0) {
			update.libraries = libraries;
		}
		
	}
		
	if (isAdmin !== null && c.getSession(req).isAdmin == true) {
		update.isAdmin = isAdmin == 1 ? true : false;
	}
		
	if (email != null)
		update.email = email;
		
	//Seul un admin ou le user lui-même peut modifier un mot de passe
	if (password != null && (c.getSession(req).isAdmin == true || c.getSession(req).id == id)) 
		update.password = password;
		
	if (Object.keys(update).length === 0 && update.constructor === Object)
		return c.responseError(res, 'Nothing to change', 200);	
	
	c.collecUsers().findOneAndUpdate(
		{
			_id: id
		},
		{
			$set: update
		}).then((user) => {
			
			delete user.password;
			
			return c.responseJSON(res, { success: true, data: user }, 200);

	}).catch((err) => {
			return c.responseError(res, 'Can\t edit user '+id, 400);
	});

}

exports.getParams = function(req, res) {
	const id = c.ObjectID(req.params.userId); //Gérer le droit....
	
	c.collecUsers().findOne(
		{
			_id: id
		}).then((user) => {
			
			delete user.password;
			
			return c.responseJSON(res, { success: true, data: user }, 200);

	}).catch((err) => {
			return c.responseError(res, 'Can\t find user '+id, 400);
	});
}
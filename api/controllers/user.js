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
			return c.responseError(res, 'Login already Used');
		}

		var hashedPassword = bcrypt.hashSync(password, 8);

		c.collecUsers().insert({login: login, email: email, password: hashedPassword})
		.then((user) => {

			// create a token
			var token = jwt.sign({ id: user._id }, c.app().config.secretKey);

			c.storeSession(token, {
				libraries: ['5678'],
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

			if (isMatch == false)
				return c.responseError(res, 'Authentication failed. Wrong password.', 401);
			else {

				var token = jwt.sign({ id: user._id }, c.app().config.secretKey);

				c.storeSession(token, {
					libraries: user.libraries,
					login: login
				});

				return c.responseJSON(res, { success: true, token: token }, 200);
			}
		});

	}).catch((err) => {
		return c.responseError(res, 'Authentication failed. User not found.', 500);
	});

}

exports.setLibraries = function(req, res) {
	const id = c.ObjectID(req.params.userId); //Gérer le droit....
	const libraries = req.body.libraries ? JSON.parse(decodeURIComponent(req.body.libraries)) : false;


	if (libraries == false || libraries.length == 0)
		return c.responseError(res, 'Param error', 400);

	c.collecUsers().findOneAndUpdate(
		{
			_id: id
		},
		{
			$set: { libraries: libraries }
		}).then((user) => {

			return c.responseJSON(res, { success: true, data: user.libraries }, 200);

	}).catch((err) => {
			return c.responseError(res, 'Can\t edit user '+id, 400);
	});

}

exports.getLibraries = function(req, res) {
	const id = c.ObjectID(req.params.userId); //Gérer le droit....

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

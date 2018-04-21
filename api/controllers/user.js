//Database
var mongo = require('mongodb');
var monk = require('monk');

//Filesystem
var fs = require('fs');

//Authentification
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

//utilitaires communs à tous les controlleurs
var c = require('./c');


exports.setApp = function(ap) {
	c.setApp(ap);
}


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
			var token = jwt.sign({ id: user._id }, c.app.config.secretKey, {
				expiresIn: 86400 // expires in 24 hours
			});

			return c.responseJSON(res, { auth: true, token: token }, 200);
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

				var token = jwt.sign({ id: user._id }, c.app.config.secretKey, {
					expiresIn: 86400 // expires in 24 hours
				});

				return c.responseJSON(res, { auth: true, token: token }, 200);
			}
		});
		
	}).catch((err) => {
		return c.responseError(res, 'Authentication failed. User not found.', 500);
	});

}
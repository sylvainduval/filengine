//Filesystem
var fs = require('fs');

//Authentification
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

//Models
var User   = require('../../models/user'); // get our mongoose model

//utilitaires communs à tous les controlleurs
var c = require('../includes/common');

var core = require('../../app/core');


// CREATES A NEW USER
exports.register = function(req, res) {
	var login     = req.body.login     ? req.body.login : false;
	var email     = req.body.email     ? req.body.email : false;
	var password  = req.body.password  ? req.body.password : false;
	
	//Optionnel (Dans ce cas, il faut être admin identifié et avoir accès aux librairies indiquée)	
	var libraries = req.body.libraries ? JSON.parse(decodeURIComponent(req.body.libraries)) : null;


	if (c.checkAuth(req, res) == true && c.getSession(req).isAdmin == true && libraries !== null && libraries.length > 0) {

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
	}
	else {
		libraries = []
	}

	if (!login || !email || !password) {
		return c.responseError(res, 'invalid parameters');
	}
	
	var hashedPassword = bcrypt.hashSync(password, 8);
	
	var usr = new User({ 
	    login: login, 
	    email: email, 
	    password: hashedPassword, 
	    libraries: libraries, 
	    deleted: false
	});

	
	usr.save(function(err, data) {
	    if (err) {
		    return c.responseError(res, err, 403);
		}
	
	    return c.responseJSON(res, { success: true, data: data }, 201);
	});

}

//LOGIN
exports.login = function(req, res) {
	var login = req.body.login ? req.body.login : false;
	var password = req.body.password ? req.body.password : false;

	if (!login || !password) {
		return c.responseError(res, 'invalid parameters');
	}
	


	// find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
	User.findOne({ 'login': login, deleted: false }, /*'password',*/ function (err, user) {
	  if (err) 
	  	return c.responseError(res, err, 500);
	  	
	  if (user == null)
	  	return c.responseError(res, 'Authentication failed. User not found.', 500);
	  
	  bcrypt.compare(password, user.password, function(err, isMatch) {
			
			if (isMatch == true) {

				var token = jwt.sign({ id: user._id }, core.config().secretKey);
				
				//Les super Admin ont droit à toutes les librairies
				if (user.isSuperAdmin) {
					user.isContributor = true;
					user.libraries = [];
					for (var i in core.config().mediaLibraries)
						user.libraries.push(core.config().mediaLibraries[i].id);
				}
				
				if (user.isAdmin) {
					user.isContributor = true;
				}
				

				c.storeSession(token, {
					id: user._id.toString(),
					libraries: user.libraries,
					login: login,
					isAdmin: user.isAdmin ? user.isAdmin : false,
					isSuperAdmin: user.isSuperAdmin ? user.isSuperAdmin : false,
					isContributor: user.isContributor ? user.isContributor : false
				});

				return c.responseJSON(res, { success: true, token: token }, 200);
			}
			else
				return c.responseError(res, 'Authentication failed. Wrong password.', 401);
		});
	 
	  
	  
	});

}

exports.logout = function(req, res) {

	if (req.headers['x-access-token']) {
		
		var token = req.headers['x-access-token'];
		
		if (c.deleteSession(token))
			return c.responseError(res, '', 204);

	}

	return c.responseError(res, 'Not login', 400);

}


exports.getLibraries = function(req, res) {
	const id = c.ObjectID(req.params.userId);
	
	//Seul le user lui même ou un admin peut afficher les librairies d'un user
	if (c.getSession(req).isAdmin == false && c.getSession(req).id != id)
		return c.responseError(res, 'Forbidden', 403);


	User.findById(id, function (err, user) {
		if (err) 
			return c.responseError(res, err, 500);
		
		if (user == null)
			return c.responseError(res, 'Can\t find user '+id, 400);
			
		var r = [];
		
		var libs = user.libraries.toBSON();

		for (var i in libs) {
			r.push(core.getLibrary(libs[i]));
		}
		
		return c.responseJSON(res, { success: true, data: r }, 200);
		
			
	});

}

exports.setParams = function(req, res) {
	const id            = c.ObjectID(req.params.userId); //Gérer le droit....
	const libraries     = req.body.libraries     ? JSON.parse(decodeURIComponent(req.body.libraries)) : null;
	const isAdmin       = req.body.isAdmin       ? req.body.isAdmin : null;
	const isContributor = req.body.isContributor ? req.body.isContributor : null;
	const email         = req.body.email && req.body.email != null       ? req.body.email : null;
	const password      = req.body.password && req.body.password != null ? bcrypt.hashSync(req.body.password, 8) : null;

	//Seul le user lui-même ou un admin peut éditer un user
	if (c.getSession(req).isAdmin == false && c.getSession(req).id != id)
		return c.responseError(res, 'Forbidden', 403);
		
	

	var update = {}

	var sessLib = c.getSession(req).libraries;
	
	if (libraries !== null && libraries.length > 0) {
		
		//Ce user doit lui-même avoir accès aux librairies qu'il veut autoriser, ou être super admin...
		
		
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
		
	//Seul un admin peut modifier le droit isContributor
	if (isContributor !== null && c.getSession(req).isAdmin == true)
		update.isContributor = isContributor == 1 ? true : false;
		
	//Seul un admin ou le user lui-même peut modifier un mot de passe
	if (password != null && (c.getSession(req).isAdmin == true || c.getSession(req).id == id)) 
		update.password = password;
	
	if (Object.keys(update).length === 0 && update.constructor === Object)
		return c.responseError(res, 'Nothing to change', 200);	
	
	
	User.findOne({ _id: id, deleted: false }, /*'password',*/ function (err, user) {
		if (err) 
			return c.responseError(res, err, 500);
				
		if (user == null)
			return c.responseError(res, 'User not found', 400);
	  	
	  	//Un user, même admin (mais pas super admin) ne peut modifier un autre user que s'ils partagent les mêmes librairies
		//toutes les librairies du modifié (u.libraries) doivent donc être déjà accessibles au modifieur (être dans c.getSession(req).libraries)
		if (c.getSession(req).isSuperAdmin == false && user.libraries) {
			var found = 0;
			for (var j in user.libraries) {
				for (var i in sessLib) {
				
					if (sessLib[i] == user.libraries[j])
						found++;
				}
			}
			
			if (found < user.libraries.length)
				return c.responseError(res, 'Not allowed to edit this user (libraries mismatch)', 403);
		}
		
		//Exécution de la mise à jour
		User.findOneAndUpdate({ _id: id},{ $set: update }, {new: true}, function (err, data) {
			if (err) 
				return c.responseError(res, err, 500); 

			return c.responseJSON(res, { success: true, data: data }, 200);
		});

	});

}

exports.getParams = function(req, res) {
	const id = c.ObjectID(req.params.userId);

	User.findById(id, function (err, user) {
		if (err) 
			return c.responseError(res, err, 500);
		
		if (user == null)
			return c.responseError(res, 'Can\t find user '+id, 400);

		user.password = undefined;
			
		return c.responseJSON(res, { success: true, data: user }, 200);

	});
}

exports.delete = function(req, res) {
	const id = c.ObjectID(req.params.userId);
	
	if (c.getSession(req).isAdmin == false) {
		return c.responseError(res, 'Forbidden: only admin can delete user', 403);
	}
	
	
	
	
	User.findById(id, function (err, user) {
		if (err) 
			return c.responseError(res, err, 500);
				
		if (user == null)
			return c.responseError(res, 'User not found', 400);
			
		if (user.isSuperAdmin)
			return c.responseError(res, 'Forbidden', 403);
			
		//Un user, même admin (mais pas super admin) ne peut modifier un autre user que s'ils partagent les mêmes librairies
		//toutes les librairies du modifié (u.libraries) doivent donc être déjà accessibles au modifieur (être dans c.getSession(req).libraries)
		if (c.getSession(req).isSuperAdmin == false && user.libraries) {
			
			var sessLib = c.getSession(req).libraries;
			var found = 0;
			
			for (var j in user.libraries) {
				for (var i in sessLib) {
				
					if (sessLib[i] == user.libraries[j])
						found++;
				}
			}
			
			if (found < user.libraries.length)
				return c.responseError(res, 'Not allowed to edit this user (libraries mismatch)', 403);
		}
		
		//Exécution de la mise à jour
		User.findOneAndUpdate(
			{ _id: id}, 
			{ $set: {password: false, email: false, deleted: true} }, 
			function (err, user) {
				
				if (err) 
					return c.responseError(res, err, 500); 
					
				if (user == null)
					return c.responseError(res, 'User not found', 400);
		
				return c.responseJSON(res, { success: true, data: user }, 200);
			}
		);

	});

}
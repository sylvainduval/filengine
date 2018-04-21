var monk = require('monk');

//Authentification
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');


module.exports = {
	
	setApp: function(ap) {
		this.app = ap;
	},
	
	getLibrary: function(req) {
		if (req.params.mediaLibraryId) {
			return this.app.getLibrary(req.params.mediaLibraryId);
		}
		return false;
	},

	collecFiles: function(mediaLibrary) {
		return this.app.db.get('lib_'+mediaLibrary.id+'_files');
	},
	
	
	collecDirs: function(mediaLibrary) {
		return this.app.db.get('lib_'+mediaLibrary.id+'_dirs');
	},
	
	collecUsers: function() {
		return this.app.db.get('users');
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
		  
		return jwt.verify(token, this.app.config.secretKey, function(err, decoded) {
		    if (err) 
		    	return false;/*res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		    
		    res.status(200).send(decoded);*/
		    else
		    	return true;
		});
		
		
		
	},
	
	responseJSON: function(res, obj, status) {
		res.status(status);
		res.json(obj);
		
		return res;
	},
	responseError: function(res, err, status) {
		if (typeof(status) == "undefined")
			status = 400;
		
		res.status(status);
		res.json({error: err});
		
		return res;
	}

}
//API


var express = require('express'),
		api = express();

const url = require('url');
const querystring = require('querystring');

var bodyParser = require('body-parser');

const fileUpload = require('express-fileupload');

const cors = require('cors');

//Common
var c = require('api/includes/common');
var sess = require('api/includes/session');
var core = require('app/core');

var file = require('api/controllers/file');
var user = require('api/controllers/user');
var library = require('api/controllers/library');
var group = require('api/controllers/group');

module.exports = function() {

	//Démarrage API
	api.listen(core.config().apiPort);
	core.stdout(null, "API listening on port: "+core.config().apiPort);


	//Upload
	api.use(fileUpload());

	// parse application/x-www-form-urlencoded
	api.use(bodyParser.urlencoded({ extended: false }))

	// parse application/json
	api.use(bodyParser.json())

	if (core.config().devMode) {
		api.use(cors({
			origin: '*'
		}));
	}

	api.use(function (req, res, next) {

		if (core.config().devMode) {
			res.header("Access-Control-Allow-Origin", "*");
		}
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

		if ( req.originalUrl != '/login' && req.originalUrl !='/register' && sess.checkAuth(req, res) == false) {

			return c.responseError(res, 'Invalid Token. Please login.', 401);
		}
		else
			next();
	});

	//Action sur les librairies
	api.route('/admin/library/:mediaLibraryId')
		.get(library.get)
		.put(library.save);

	api.route('/admin/library/add')
		.post(library.create);

	api.route('/libraries')
		.get(library.list);

	//Action sur les groupes d'accès
	api.route('/admin/group/:groupId')
		.get(group.get)
		.put(group.save)
		.delete(group.delete);

	api.route('/admin/group/add')
		.post(group.create);

	api.route('/groups')
		.get(group.list);

	//Action sur les fichiers
	api.route('/:mediaLibraryId/file/:fileId')
		.get(file.get);

	api.route('/:mediaLibraryId/upload/:parentId')
		.post(file.upload);




	//Action sur les utilisateurs
	api.route('/register')
		.post(user.register);

	api.route('/login')
		.post(user.login);

	api.route('/logout')
		.post(user.logout);

	api.route('/users')
		.get(user.list)

	api.route('/user/:userId')
		.get(user.get)
		.put(user.save)
		.delete(user.delete);
};

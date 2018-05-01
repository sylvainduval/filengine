module.exports = function(app, api) {


	var bodyParser = require('body-parser');

	//Upload
	const fileUpload = require('express-fileupload');
	api.use(fileUpload());

	// parse application/x-www-form-urlencoded
	api.use(bodyParser.urlencoded({ extended: false }))

	// parse application/json
	api.use(bodyParser.json())

	//Common
	var c = require('../includes/common');
	c.setApp(app);

	api.use(function (req, res, next) {

		if ( req.originalUrl != '/login' && req.originalUrl !='/register' && c.checkAuth(req, res) == false) {
			
			return c.responseError(res, 'Invalid Token. Please login.', 401);
		}
		else
			next();
	});


	var file = require('../controllers/file');

	/*api.route('/files')
		.get(filengine.get_files);
		.post(filengine.create_file);*/

	api.route('/:mediaLibraryId/file/:fileId')
		.get(file.get);

	api.route('/:mediaLibraryId/upload/:parentId')
		.post(file.upload);


	var user = require('../controllers/user');


	api.route('/register')
		.post(user.register);

	api.route('/login')
		.post(user.login);

	api.route('/user/:userId/libraries')
		.get(user.getLibraries);
		//.put(user.setLibraries);
		
	api.route('/user/:userId')
		.get(user.getParams)
		.put(user.setParams);
};

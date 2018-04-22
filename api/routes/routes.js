module.exports = function(app, api) {
	
	
	var bodyParser = require('body-parser');
	
	//Upload
	const fileUpload = require('express-fileupload');
	api.use(fileUpload());
	
	// parse application/x-www-form-urlencoded
	api.use(bodyParser.urlencoded({ extended: false }))
	
	// parse application/json
	api.use(bodyParser.json())
	
	
	var file = require('../controllers/file');
	file.setApp(app);
	/*api.route('/files')
		.get(filengine.get_files);
		.post(filengine.create_file);*/
	
	api.route('/:mediaLibraryId/file/:fileId')
		.get(file.get);
	
	api.route('/:mediaLibraryId/upload/:parentId')
		.post(file.upload);
	
	
	var user = require('../controllers/user');
	user.setApp(app);
	
	api.route('/register')
		.post(user.register);

	api.route('/login')
		.post(user.login);
};
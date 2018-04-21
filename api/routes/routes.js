module.exports = function(app, api) {
	var filengine = require('../controllers/main');
	
	var bodyParser = require('body-parser');
	
	// parse application/x-www-form-urlencoded
	api.use(bodyParser.urlencoded({ extended: false }))
	
	// parse application/json
	api.use(bodyParser.json())
	
	filengine.setApp(app);
	/*api.route('/files')
		.get(filengine.get_files);
		.post(filengine.create_file);*/
	
	api.route('/:mediaLibraryId/file/:fileId')
		.get(filengine.get_file)
		.post(filengine.test_post);
	
};
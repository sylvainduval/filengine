// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*var sch = new Schema({
	path: { type : Schema.Types.ObjectId, required : true },
	name: { type : String, required : true },
	inode: { type : Number, required : true },
	size: { type : Number, required : true },
	creationDate: { type : Date, required : true },
	modificationDate: { type : Date, required : true },
	version: { type : Number, required : true }
});*/

var libraries = {}

function buildLibraries(libs) {
	for (var i in libs) {
		if (typeof(libraries['lib_'+ libs[i].id]) == "undefined")
			libraries['lib_'+ libs[i].id] = mongoose.model('lib_'+ libs[i].id + '_files',
			new Schema({
				path: {
					type : Schema.Types.ObjectId,
					required : true,
					ref: 'lib_'+ libs[i].id + '_dirs'
				},
				name: { type : String, required : true },
				inode: { type : Number, required : true },
				size: { type : Number, required : true },
				creationDate: { type : Date, required : true },
				modificationDate: { type : Date, required : true },
				version: { type : Number, required : true }
			})
		);
	}
}

function lib(mediaLib) {
	if (typeof(mediaLib) == 'object')
		return libraries['lib_'+ mediaLib.id];
	else
		return libraries['lib_'+ mediaLib];

}

// set up a mongoose model and pass it using module.exports
//module.exports = mongoose.model('File', sch);

module.exports = {
	buildLibraries: buildLibraries,
	lib: lib
}

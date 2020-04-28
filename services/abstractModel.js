module.exports = {
	isObjectID: function(str) {
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		return checkForHexRegExp.test(str);
	},
	stdListQuery: function(schema, params, cb) {
		params.offset = params.offset ? parseInt(params.offset) : 0;
		params.limit = params.limit ? parseInt(params.limit) : null;

		schema.estimatedDocumentCount({}, function(err, count) {
			let query = schema.find({}).skip(params.offset).limit(params.limit);
			query.exec(function (err, r) {
				if (typeof(cb) == 'function') {
					cb.call(this, err, { success: true, total: count, data: r });
				}
			});
		});
	}
}

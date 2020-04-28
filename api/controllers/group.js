//Models
var Library = require('models/library'); // get our mongoose model
var Group = require('models/group');
var Dir = require('models/dir');

//utilitaires communs à tous les controlleurs
var c = require('api/includes/common');
var sess = require('api/includes/session');
var core = require('app/core');
var abstractModelService = require('services/abstractModel');

function getGroup(groupId, cb) {

	Group.findById(groupId)
    .populate({ path: 'library', select: 'id active' })
    .exec(function(err, data) {
        if (err) {
	        c.responseInt(cb, err, null, 500);
        }

        if (data == null) {
	        c.responseInt(cb, 'ID not found', null, 400);
        }

		c.responseInt(cb, null, { success: true, data: data.toObject() }, 200);
    })
}

function getGroups(params, cb) {

	var and = [/*{deleted: false}*/];

	if (params.req) {
		var sessLib = sess.getSession(params.req).libraries;
		var sessLib_id = [];
		for (let l of sessLib) {
			sessLib_id.push(core.getLibrary(l)._id);
		}

		if (!sess.getSession(params.req).isSuperAdmin) {
			and.push({library:{ $in: sessLib_id } });
		}
	}

	if (params.library != null) {
		and.push({library: params.library });
	}

	if (params.search != null) {
		and.push({ name: {$regex : ".*" + params.search + ".*"}});
	}

	var find = and.length > 0 ? { $and: and } : {}


	let schema = Group.find(find)
					.populate({ path: 'library', select: 'id active' })

	abstractModelService.stdListQuery(schema, params, function(err, r) {
		if (err)
			c.responseInt(cb, err, null, 500);
		else
			c.responseInt(cb, null, r, 200);
	});
}


module.exports = {

	//Méthodes internes
	getGroup: getGroup,
	getGroups: getGroups,

	//Méthodes de l'API
	get: function(req, res) {
		let groupId = req.params.groupId;

		if (!abstractModelService.isObjectID(groupId)) {
			return c.responseError(res, 'Wrong parameters', 400);
		}

	    getGroup(groupId, function(err, data, code) {
		    if (code >= 400) {
			    return c.responseError(res, err, code);
			}
			else {
				return c.responseJSON(res, data, code);
			}
		});

	},

	save: function(req, res) {
		let groupId = req.params.groupId;
		var update = {
			name: req.body.name ? req.body.name.trim() : null
		}
		if (update.name == null || !abstractModelService.isObjectID(groupId)) {
			return c.responseError(res, 'Wrong parameters', 400);
		}

	    if (!sess.getSession(req).isAdmin)
	        return c.responseError(res, 'Forbidden', 400);

	    Group.findOneAndUpdate(
	        { _id: groupId },
	        { $set: update },
	        { new: true },
	        function (err, data) {
	            if (err) {
	                return c.responseError(res, err, 500);
	            }

	            return c.responseJSON(res, { success: true, data: data }, 200);
	        }
	    );
	},


	create: function(req, res) {
		var insert = {
			library: req.body.library,
			name: req.body.name ? req.body.name.trim() : null
		}
		if (!abstractModelService.isObjectID(insert.library) || insert.name == null) {
			return c.responseError(res, 'Wrong parameters', 400);
		}

	    if (!sess.getSession(req).isAdmin)
	    	return c.responseError(res, 'Forbidden', 400);

	    var g = new Group(insert);

	    g.save(function(err, data) {
	        if (err)
	            return c.responseError(res, err, 500);

	        return c.responseJSON(res, { success: true, data: data }, 200);
	    });

	},


	list: function(req, res) {

		var params = {}

		params.offset = req.query.offset ? parseInt(req.query.offset) : 0;
		params.limit = req.query.limit ? parseInt(req.query.limit) : null;
		params.search = req.query.search ? req.query.search.trim() : null;
		params.library = req.query.library ? req.query.library : null;
		params.req = req;

		if (params.library != null && !abstractModelService.isObjectID(params.library)) {
			params.library = core.getLibrary(params.library)._id;
		}

		getGroups(params, function(err, data, code) {
		    if (code >= 400) {
			    return c.responseError(res, err, code);
			}
			else {
				return c.responseJSON(res, data, code);
			}
		});

	},

	delete: function(req, res) {

		return c.responseJSON(res, 'A faire...', 200);
	}

}

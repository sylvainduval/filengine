//Filesystem
//var fs = require('fs');

//var watcher = require('../../app/watcher.js');

//Models
var Library = require('../../models/library'); // get our mongoose model

var Group = require('../../models/group');
var Dir = require('../../models/dir');

//utilitaires communs à tous les controlleurs
var c = require('../includes/common');
var sess = require('../includes/session');

var core = require('../../app/core');

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

        //Récupération des entrées dans la collection des dirs
        Dir.lib(data.library.id).find({
            'entryPoint': { 
                $in: [groupId]
            } 
        }, 'path name', function(err, g) {
            if (err) {
                c.responseInt(cb, err, null, 500);
            }

            data = data.toObject();
            data.entryPoints = g;

			c.responseInt(cb, null, { success: true, data: data }, 200);
        });
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
					//.populate({ path: 'entryPoints', select: 'path name' });

	c.stdListQuery(schema, params, function(err, r) {
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
	    let groupId = req.params.groupId ? c.ObjectID(req.params.groupId) : false;
	
	    if (groupId == false)
	        return c.responseError(res, 'Wrong parameters', 400);
	        
	        
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
	    let groupId = req.params.groupId ? c.ObjectID(req.params.groupId) : false;
	    let dirs = req.body.dirs ? JSON.parse(decodeURIComponent(req.body.dirs)) : null;
	
	    var update = {}
	
	    update.name = req.body.name ? req.body.name.trim() : null;
	
	
	    if (update.name == null || groupId == false)
	        return c.responseError(res, 'Wrong parameters', 400);
	
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
	
	            var lib = core.getLibrary(data.library);
	
	
	            if (dirs != null) {
	
	
	                //Ajouter aux dirs indiqués l'entrypoint du groupId
	                for (let d of dirs) {
	                    Dir.lib(lib.id).findById(d, function(err, di) {
	
	                        var found = false;
	                        for (let ep of di.entryPoint) {
	                            if (ep.toString() == groupId)
	                                found = true;
	                        }
	                        if (found == false) {
	                            di.entryPoint.push(groupId);
	                            di.save(function(err) {
	                                if (err) {
	                                    return c.responseError(res, err, 500);
	                                }
	                            });
	                        }
	                    });
	                }
	
	                //Retirer de tous les dirs les entrypoints du groupId 
	                //qui ne sont pas dans dirs
	                Dir.lib(lib.id).find({
	                    'entryPoint': { 
	                        $in: [groupId]
	                    } 
	                }, function(err, d) {
	                    if (err) {
	                        return c.responseError(res, err, 500);
	                    }
	
	                    //Pour tous les d trouvés, si l'_id n'est pas dans dirs, 
	                    //enlever le groupId de ses entryPoint
	                    for (let result of d) {
	
	                        if (dirs.length == 0 || dirs.indexOf(result._id.toString()) == -1) {
	                           
	                            result.entryPoint.splice(groupId, 1);
	
	                            result.save(function(err) {
	                                if (err) {
	                                    return c.responseError(res, err, 500);
	                                }
	                            });
	                        }
	                    }
	                });
	            }
	
	            return c.responseJSON(res, { success: true, data: data }, 200);
	        }
	    );
	},
	
	
	create: function(req, res) {

	    var insert = {}
	
	    insert.library = req.body.library ? c.ObjectID(req.body.library) : false;
	    insert.name = req.body.name ? req.body.name.trim() : null;
	
	    if (insert.library == false || insert.name == null)
	        return c.responseError(res, 'Wrong parameters', 400);
	
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
	
		if (params.library != null && !c.ObjectID(params.library)) {
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


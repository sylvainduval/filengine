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


exports.get = function(req, res) {
    let groupId = req.params.groupId ? c.ObjectID(req.params.groupId) : false;

    if (groupId == false)
        return c.responseError(res, 'Wrong parameters', 400);

    Group.findById(groupId)
    .populate({ path: 'library', select: 'id active' })
    .exec(function(err, data) {
        if (err) {
            return c.responseError(res, err, 500);
        }

        //Récupération des entrées dans la collection des dirs
        Dir.lib(data.library.id).find({
            'entryPoint.group': { 
                $in: groupId 
            } 
        }, function(err, g) {
            if (err) {
                return c.responseError(res, err, 500);
            }

            data = data.toObject();
            data.entryPoints = g;

            return c.responseJSON(res, { success: true, data: data }, 200);
        });


        
    })
}

exports.save = function(req, res) {
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
                console.log(err);
                return c.responseError(res, err, 500);
            }

            if (dirs != null) {
                console.log(dirs);
                //Retirer de tous les dirs les entrypoints du groupId 
                //qui ne sont pas dans dirs
                /*Dir.lib(data.library.id).find({
                    'entryPoint.group': { 
                        $in: groupId 
                    } 
                }, function(err, d) {
                    if (err) {
                        return c.responseError(res, err, 500);
                    }
                    //Pour tous les d trouvés, si l'_id n'est pas dans dirs, 
                    //enlever le groupId de ses entryPoint
                    /*for (let result of d) {
                        if (dirs.indexOf(result._id) == -1) {
                            result.entryPoint.group(groupId).remove();


                            result.save();
                        }
                    }
                    ?????????????????????????????????
                    */
                    


                    //Ajouter aux dirs indiqués l'entrypoint du groupId









                    return c.responseJSON(res, { success: true, data: data }, 200);
                //});


                



            }
            else
                return c.responseJSON(res, { success: true, data: data }, 200);
        }
    );



}

exports.create = function(req, res) {

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

}

exports.list = function(req, res) {

}

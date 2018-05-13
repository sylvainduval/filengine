//Filesystem
//var fs = require('fs');

//var watcher = require('../../app/watcher.js');

//Models
var Library = require('../../models/library'); // get our mongoose model
//var User = require('../../models/user');
var Group = require('../../models/group')

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

        return c.responseJSON(res, { success: true, data: data }, 200);
    })
}

exports.save = function(req, res) {

}

exports.create = function(req, res) {

    var insert = {}

    insert.library = req.body.library ? c.ObjectID(req.body.library) : false;
    insert.name = req.body.name ? req.body.name.trim() : null;
    insert.entryPoints = []

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

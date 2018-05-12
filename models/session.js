// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sch = new Schema({
    token: { type : String , unique: true, required : true },
    expire: Number,
    data: { type : Object }
});

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Sessions', sch);

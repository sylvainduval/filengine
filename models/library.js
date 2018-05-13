// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sch = new Schema({ 
    id: { type : String , unique: true, required : true }, 
    rootPath: { type : String , unique: true, required : true },
    fullScanDelay: { type : Number, required : true }, 
    active: { type : Boolean, required : true }
});

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Libraries', sch);

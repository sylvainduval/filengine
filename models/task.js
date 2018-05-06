// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sch = new Schema({ 
    type: { type : String, required : true }, 
    mediaLibrary: String,
    path: String, 
    recurse: Boolean,
    priority: Number,
    next: Number,
    creationDate: Date,
    processing: { type : Boolean, required : true, default: false },
    complete: { type : Boolean, required : true, default: false },
    error: String
}, { collection: 'tasks' });

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Task', sch);
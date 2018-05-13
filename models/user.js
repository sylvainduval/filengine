// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sch = new Schema({
    login: {
        type : String ,
        unique: true,
        required : true
    },
    email: String,
    password: String,
    isAdmin: Boolean,
    isContributor: Boolean,
    isSuperAdmin: Boolean,
    deleted: {
        type : Boolean,
        required : true
    },
    libraries: [
        String
    ],
    groups: [
        {
            type : Schema.Types.ObjectId,
            ref: 'Groups'
        }
    ]
}, { collection: 'users' });

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', sch);

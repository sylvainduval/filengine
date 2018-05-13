// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sch = new Schema({
    name: {
        type : String ,
        required : true
    },
    library: {
        type : Schema.Types.ObjectId,
        ref: 'Libraries',
        required : true
    },
    entryPoints: [
        new Schema({
            dir: Schema.Types.ObjectId
        })
    ]

});

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Groups', sch);

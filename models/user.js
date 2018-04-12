var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    polls: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Polls"
    }]
});
/*
UserSchema.pre("save", function(next){
    console.log("About to save user");
    next();
});
UserSchema.post("save", function(next){
    console.log("Successfully saved user");
    next();
});
*/

var Model = mongoose.model("User", UserSchema);

module.exports = Model;

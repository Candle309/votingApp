var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PollSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    options: [{
        name: {
            type: String,
            required: true
        },
        votes: {
            type: Number,
            default: 0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    owner: {
        type: String,
        required: true
    }  
});

var Model = mongoose.model("Polls", PollSchema);
module.exports = Model;
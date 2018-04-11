var express = require("express");
var router = express.Router({caseSensitive: true});
var bcrypt = require("bcrypt-nodejs");
var jwt = require("jsonwebtoken");
var User = require("../models/user");

//register
router.post("/register", function(req, res){
//    console.log(req.body);
    if (req.body.name && req.body.password) {
        var user = new User();
        user.name = req.body.name;
        console.time("bcryptHashing");
        user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
        console.timeEnd("bcryptHashing");
        user.save(function(err, document) {
            if (err) {
                return res.status(400).send(err);
            } else {
                var token = jwt.sign({
                    data: document
                }, process.env.secret, {expiresIn: 3600});
                return res.status(201).send(token);
            }
        })
        
    } else {
        return res.status(400).send({
            message: "Invalid credentials supplied!"
        });
    }
});


module.exports = router;
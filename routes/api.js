var express = require("express");
var router = express.Router({caseSensitive: true});
var bcrypt = require("bcrypt-nodejs");
var jwt = require("jsonwebtoken");
var User = require("../models/user");
var Poll = require("../models/polls");

//test populate route to get all polls by user id
router.get("/tester", function(req, res) {
    User.findOne({name: "123"})
    .populate("polls")
    .exec(function(err, polls) {
        if (err) {
            return res.status(400).send(err);
        }
        return res.status(200).send(polls);
    })
})

//get all polls
router.get("/polls", function(req, res) {
    Poll.find({}, function(err, polls) {
        if(err) {
            return res.status(400).send(err);
        }
        if(polls.length < 1) {
            return res.status(400).send("No polls here yet!")
        }
        return res.status(200).send(polls);
    })
})

//create a new poll
router.post("/polls", authenticate, function(req, res) {
    if(!req.body.options || !req.body.name) {
        return res.status(400).send("No poll data supplied!");
    }
    var poll = new Poll();
    poll.name = req.body.name;
    poll.options = req.body.options;
 //   var token = req.headers.authorization.split(" ")[1];
    poll.user = req.body.id;
    poll.save(function(err, resp) {
        if(err) {
            return res.status(400).send(err);
        }
        return res.status(201).send(resp);
    })
});

//verification of token
router.post("/verify", function(req, res) {
    if(!req.body.token) {
        return res.status(400).send("No token has been provided!");
    }
    jwt.verify(req.body.token, process.env.secret, function(err, decoded) {
        if (err) {
            return res.status(400).send("Error with token");
        }
        return res.status(200).send(decoded);
    })
});

//login
router.post("/login", function(req, res){
    if (req.body.name && req.body.password) {
        User.findOne({name : req.body.name}, function(err, user){
            if (err) {
                return res.status(400).send("An error has occured. Please try again");
            }
            if (!user) {
                return res.status(404).send("No user has been registered with these credentials");
            }
            if (bcrypt.compareSync(req.body.password, user.password)) {
                var token = jwt.sign({
                    data: user
                }, process.env.secret, {expiresIn: 3600});
                return res.status(200).send(token);
            }
            return res.status(400).send("Password is not correct!");
        })
    } else {
        return res.status(400).send({
            message: "Invalid credentials supplied!"
        });
    }
});

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

//authentication middleware
function authenticate(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(400).send("No token supplied");
    }
    if (req.headers.authorization.split(" ")[1]) {
        var token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.secret, function(err, decoded) {
            if (err) {
                return res.status(400).send(err);
            }
            console.log("continueing with middleware chain");
            next();
        })
    }
}

module.exports = router;
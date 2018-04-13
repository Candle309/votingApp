var express = require("express");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("jsonwebtoken");
var User = require("../models/user");
var Poll = require("../models/polls");
var router = express.Router({caseSensitive: true});
/*
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
})*/


//vote
router.put('/polls/', function(request, response) {
    console.log(typeof request.body.vote);
    Poll.findById(request.body.id, function(err, poll) {
        if (err) {
            return response.status(400).send(err)
        }
        console.log(poll)
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i]._id.toString() === request.body.vote) {
                console.log('hit');
                poll.options[i].votes += 1;
                poll.save(function(err, res) {
                    if (err) {
                        return response.status(400).send(err)
                    } else {
                        return response.status(200).send({
                            message: 'Successfully updated poll!'
                        })
                    }
                })
            }
        }
    })
});


//get a poll
router.get('/poll/:id', function(request, response) {
    Poll.findOne({ _id: request.params.id }, function(err, poll) {
        if (err) {
            return response.status(400).send(err)
        } else {
            return response.status(200).send(poll)
        }
    })
});

//get all polls
router.get("/polls", function(req, res) {
    Poll.find({}, function(err, polls) {
        if(err) {
            return res.status(400).send(err);
        }
        if(polls.length < 1) {
            return res.status(400).send("No polls here yet!")
        }
        return res.status(200).json(polls);
    })
});

//get user-polls
router.get('/user-polls/:name', function(request, response) {
    if (!request.params.name) {
        return response.status(400).send({
            message: 'No user name supplied';
        })
    } else {
        Poll.find({owner: request.params.name }, function(err, documents) {
            if (err) {
                return response.status(400).send(err);
            } else {
                return response.status(200).send(documents);
            }
        })
    }
});

//create a new poll
router.post("/polls", authenticate, function(req, res) {
    if(!req.body.options || !req.body.name) {
        return res.status(400).send("No poll data supplied!");
    }
    var poll = new Poll();
    poll.name = req.body.name;
    poll.options = req.body.options;
    poll.owner = request.body.owner;
    poll.save(function(err, resp) {
        if(err) {
            if (err.code === 11000) {
                return response.status(400).send('No dupes!');
            }
            return response.status(400).send(err)
        }
        else return res.status(201).send({
            message: 'Successfully created a poll',
            data: document
        });
    })
});

//add an option to poll
router.put('/polls/add-option', function(request, response) {
    var id = request.body.id;
    var option = request.body.option;
    Poll.findById(id, function(err, poll) {
        if (err) {
            return response.status(400).send(err)
        }
        for (var i = 0; i < poll.options.length; i++) {
            if (poll.options[i].name === option) {
                return response.status(403).send({
                    message: 'Option already exists!'
                })
            }
        }
        poll.options.push({
            name: option,
            votes: 0
        });
        poll.save(function(err, res) {
            if (err) {
                return response.status(400).send({
                    message: 'Problem has occurred in saving poll!',
                    error: err
                })
            } else {
                return response.status(201).send({
                    message: 'Successfully created a poll option!'
                })
            }
        })
    })
});

//delete a poll
router.delete('/polls/:id', function(request, response) {
    Poll.findById(request.params.id, function(err, poll) {
        if (err) {
            return response.status(400).send({
                message: 'No poll with specified id'
            })
        }
        if (poll) {
            var token = request.headers.authorization.split(' ')[1];
            jwt.verify(token, 'fcc', function(err, decoded) {
                if (err) {
                    return response.status(401).json('Unauthorized request: invalid token')
                } else {
                    console.log(poll)
                    if (decoded.data.name === poll.owner) {
                        poll.remove(function(err) {
                            if (err) {
                                return response.status(400).send(err)
                            } else {
                                return response.status(200).send({
                                    message: 'Deleted poll'
                                })
                            }
                        })
                    } else {
                        return response.status(403).send({
                            message: 'Can only delete owned polls'
                        })
                    }
                }
            })
        }
    });
});

//verification of token
router.post("/verify", function(req, res) {
    if(!req.body.token) {
        return res.status(400).send("No token has been provided!");
    }
    jwt.verify(req.body.token, process.env.secret, function(err, decoded) {
        if (err) {
            return res.status(400).send({
                message: 'invalid token',
                error: err
            })
        }
        else return res.status(200).send({
            message: 'valid token',
            decoded: decoded
        })
    })
});

//login
router.post("/login", function(req, res){
    if (req.body.name && req.body.password) {
        User.findOne({name : req.body.name}, function(err, user){
            if (err) {
                return res.status(400).send("An error has occured. Please try again");
            }
            else if (!user) {
                return res.status(404).send("No user has been registered with these credentials");
            }
            else if (bcrypt.compareSync(req.body.password, user.password)) {
                var token = jwt.sign({
                    data: user
                }, process.env.secret, {expiresIn: 3600});
                return res.status(200).send(token);
            }
            return res.status(400).send("Password is not correct!");
        })
    } else {
        return res.status(400).send({
            message: 'Server error in posting to api'
        });
    }
});

//register
router.post("/register", function(req, res){
    if (req.body.name && req.body.password) {
        var user = new User();
        user.name = req.body.name;
        console.time("bcryptHash");
        user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
        console.timeEnd("bcryptHash");
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
            message: 'Server error in posting to api'
        });
    }
});

//authentication middleware
function authenticate(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(400).send("No token supplied");
    } else{
        var token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.secret, function(err, decoded) {
            if (err) {
                return res.status(401).json('Unauthorized request: invalid token');
            }
            next();
        })
    }
}

module.exports = router;
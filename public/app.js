(function(){

    var app = angular.module("app", ["ngRoute", "angular-jwt"]);

    app.run(function($http, $rootScope, $location, $window){
        $http.defaults.headers.common.Authorization = 'Bearer ' + $window.localStorage.token;
        $rootScope.$on("$routeChangeStart", function (event, nextRoute, currentRoute) {
            if (nextRoute.access.restricted !== undefined && nextRoute.access.restricted === true && !window.localStorage.token) {
                event.preventDefault();
                $location.path("/login");
            }
            if (window.localStorage.token && nextRoute.access.restricted === true) {
                $http.post("/api/verify", {token: $window.localStorage.token})
                .then(function(res) {
                    console.log("Your token is valid");
                }, function(err) {
                    delete $window.localStorage.token;
                    $location.path("/login");
                });
            }
        })
    })

    app.config(function($routeProvider, $locationProvider){

        $locationProvider.html5Mode(true);

        $routeProvider.when('/', {
            templateUrl: "main.html",
            controller: "MainController",
            controllerAs: "vm",
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/login', {
            templateUrl: "login.html",
            controller: "LoginController",
            controllerAs: "vm",
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/register', {
            templateUrl: "register.html",
            controller: "RegisterController",
            controllerAs: "vm",
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/polls', {
            templateUrl: "polls.html",
            controller: "PollsController",
            controllerAs: "vm",
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/polls/:id', {
            templateUrl: "poll.html",
            controller: "PollController",
            controllerAs: "vm",
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/profile', {
            templateUrl: "profile.html",
            controller: "ProfileController",
            controllerAs: "vm",
            access: {
                restricted: true
            }
        });
        $routeProvider.otherwise('/');
    });

    app.controller("MainController", MainController);
    function MainController(){
        var vm = this;
        vm.title = "MainController";
    }

    app.controller("LoginController", LoginController);
    function LoginController($location, $window, $http, $timeout){
        var vm = this;
        vm.title = "LoginController"; 
        vm.error = "";
        vm.login = function() {
            if (vm.user) {
                $http.post("/api/login", vm.user)
                .then(function(res){
                    $window.localStorage.token = res.data;
                    $location.path("/profile");
                }, function(err) {
                    console.log(error)
                });
            } else {
                console.log("No credentials supplied");
                vm.user = null;
                $location.path('/login');
            }
        };      
    }

    app.controller("RegisterController", RegisterController);
    function RegisterController($location, $http, $window, $timeout) {
        var vm = this;
        vm.title = "RegisterController";
        vm.register = function() {
            if(vm.user) {
                $http.post('/api/register', vm.user).
                then(function(response) {
                    $window.localStorage.token = response.data;
                    $location.path('/profile');
                }, function(err){
                    if(err.data.code === 11000) {
                        vm.error = "This user already exists";
                    }
                    vm.user = null;
                    $location.path('/register');
                });
                $timeout(function() {
                    vm.error = ''
                }, 5000)
            }
            else {
                $location.path('/register');
            }
        }
    }

    app.controller("ProfileController", ProfileController);
    function ProfileController($location, $window, jwtHelper){
        var vm = this;
        vm.title = "ProfileController";
        vm.currentUser = null;
        vm.polls = [];
        var token = $window.localStorage.token;
        var payload = jwtHelper.decodeToken(token).data;

        if (payload) {
            if(vm.currentUser !== null )  {
                vm.getPollsByUser();
            }
        }

        vm.logOut = function() {
            $window.localStorage.removeItem('token');
            vm.message = 'Logging you out...';
            $timeout(function() {
                vm.message = '';
                 $location.path('/');
            }, 2000);
        }

        vm.getPollsByUser = function() {
            $http.get('/api/user-polls/'+ vm.currentUser.name)
                 .then(function(response) {
                     console.log(response);
                     vm.polls = response.data;
                 }, function(err) {
                     console.log(err)
                 })
        }

        vm.deletePoll = function(id) {
            if(id !== null) {
                $http.delete('/api/polls/' + id).then(function(response) {
                    vm.getPollsByUser();
                }, function(err) {
                    console.log(err)
                })                
            }
            else {
                return false;
            }
        }
    }

    app.controller("PollsController", PollsController);
    function PollsController($location, $window, $http, jwtHelper){
        var vm = this;
        var user = jwtHelper.decodeToken($window.localStorage.token);
        vm.title = "PollsController";
        vm.polls = [];
        vm.poll = {
            options: [{
                name: "",
                votes: 0
            }],
            name: "",
        }

        vm.isLoggedIn = function() {
            if($window.localStorage.token && jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();

        vm.addOption = function() {
            vm.poll.options.push({
                name: "",
                votes: 0
            })
        }

        vm.getAllPolls = function() {
            $http.get("/api/polls")
            .then(function(res) {
                vm.polls = res.data;
            }, function(err) {
                console.log(err);
            })
        }
        vm.getAllPolls();

        vm.addPoll = function() {
            if(!$window.localStorage.token) {
                alert('Cannot create a poll without an account');
                return;
            }
            else if (!vm.poll) {
                console.log("Invalid data supplied!");
                return;
            }
            var payload = {
                owner: jwtHelper.decodeToken($window.localStorage.token).data.name || null,
                name: vm.poll.name,
                options: vm.poll.options,
                token: $window.localStorage.token
            }
            $http.post("/api/polls", payload)
            .then(function(res) {
                console.log(res.data);
                vm.poll = {};
                vm.getAllPolls();
            }, function(err) {
                console.error(err);
            });
        }
    }

    app.controller("PollController", PollController);
    function PollController($http, $routeParams, $location, $window){
        var vm = this;
        vm.title = "PollController";
        vm.poll;
        vm.data;
        //vm.link = "#";

        vm.addOption = function() {
            if(vm.option) {
                $http.put('/api/polls/add-option', { option: vm.option, id: $routeParams.id }).then(function(response) {
                    vm.poll.push({
                        name: vm.option,
                        votes: 0
                    })
                    vm.option = null;
                    vm.getPoll();
                });
            }
        }

        vm.getPoll  = function() {
            var id = $routeParams.id;
            $http.get('/api/poll/' + id)
                 .then(function(response) {
                    vm.id = response.data._id;
                    vm.owner = response.data.owner;
                    vm.poll = response.data.options;
                    console.log(vm.poll);
                    vm.data = response.data;
                    google.charts.load('current', {'packages':['corechart']});
                    google.charts.setOnLoadCallback(drawChart);
                 }, function(err) {
                    $location.path('/polls');
                 })
        }
        vm.getPoll();

        function drawChart() {
            var chartArray = [];
            chartArray.push(['Name', 'Votes']);
            for(var i = 0; i < vm.data.options.length; i++){
                chartArray.push([vm.data.options[i].name, vm.data.options[i].votes ])
            }
            console.log(chartArray);
            var data = google.visualization.arrayToDataTable(chartArray);
            var options = {
              title: vm.data.name
            };   
            var chart = new google.visualization.PieChart(document.getElementById('piechart'));   
            chart.draw(data, options);
        }

        vm.vote = function() {
            if(vm.selected) {
                console.log(vm.selected, vm.poll);
                $http.put('/api/polls', { id: $routeParams.id, vote: vm.selected  })
                     .then(function(response) {
                         vm.getPoll();
                     }, function(err) {
                         console.log(err)
                     })
            }
            else {
                console.log('No poll selected');
            }
        }
    }
    
}())
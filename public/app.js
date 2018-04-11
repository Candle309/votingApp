(function(){
    var app = angular.module("app", ["ngRoute", "angular-jwt"]);
    app.config(function($routeProvider, $locationProvider){
        $locationProvider.html5Mode(true);
        $locationProvider.when('/', {
            templateUrl: "./templates/main.html",
            controller: "MainController",
            controllerAs: "vm"
        });
        $locationProvider.when('/login', {
            templateUrl: "./templates/login.html",
            controller: "LoginController",
            controllerAs: "vm"
        });
        $locationProvider.when('/register', {
            templateUrl: "./templates/register.html",
            controller: "RegisterController",
            controllerAs: "vm"
        });
        $locationProvider.when('/polls', {
            templateUrl: "./templates/polls.html",
            controller: "PollsController",
            controllerAs: "vm"
        });
        $locationProvider.when('/polls/:id', {
            templateUrl: "./templates/poll.html",
            controller: "PollController",
            controllerAs: "vm"
        });
        $locationProvider.when('/profile', {
            templateUrl: "./templates/profile.html",
            controller: "ProfileController",
            controllerAs: "vm"
        });
    });
    app.controller("MainController", MainController);
    function MainController($location, $window){

    }
    app.controller("LoginController", LoginController);
    function LoginController($location, $window){
        var vm = this;
        vm.title = "LoginController";
    }
    app.controller("RegisterController", RegisterController);
    function RegisterController($location, $window){
        var vm = this;
        vm.title = "RegisterController";
    }
    app.controller("ProfileController", ProfileController);
    function ProfileController($location, $window){
        var vm = this;
        vm.title = "ProfileController";
    }
    app.controller("PollsController", PollsController);
    function PollsController($location, $window){
        var vm = this;
        vm.title = "PollsController"
    }
    app.controller("PollController", PollController);
    function PollController($location, $window){
        var vm = this;
        vm.title = "PollController"
    }
    

}())
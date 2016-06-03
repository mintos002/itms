angular.module("ngItems", ['ngRoute', 'ui.bootstrap', 'ngMessages'])
  //---------------------------------
  // CONFIG
  //---------------------------------
  .config(function($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "home.html",
        controller: "HomeController"
      })
      .when("/signup", {
        controller: "SignupController",
        templateUrl: "signup.html"
      })
      .when("/login", {
        controller: "LoginController",
        templateUrl: "login.html"
      })
      .when("/logout", {
        controller: "LogoutController"
      })
      .when("/account", {
        controller  : "AccountController",
        templateUrl : "account.html"
      })
      .when("/profile", {
        controller: "ProfileController",
        templateUrl: "profile.html"
      })
      .when("/likeditems",{
        controller: "LikedController",
        templateUrl: "likeditems.html"
      })
      .otherwise({
        redirectTo: "/"
      })
  })

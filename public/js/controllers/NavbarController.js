angular.module("ngItems")
  // create the controllers and inject Angular's $scope
  .controller('NavbarController', function($scope, Items){
    console.log('NavbarController');
    // Check if the user is logged
    token = window.localStorage.getItem("token");
    firstName = window.localStorage.getItem("firstName");

    if(token === undefined || token == null){
      console.log("NO ONLINE ");
      $scope.navbarLogged = false;
      return;
    }
    $scope.navbarLogged = true;
    $scope.nav_user_name = firstName;

  })
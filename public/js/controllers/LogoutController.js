angular.module("ngItems")
  .controller('LogoutController', function($scope, Items){
    console.log("In LogoutController");
    $scope.logout = function(){
      Items.tryLogout(function(success, message, data){
      if(!success){
        console.log("Logout Err");
      } else {
        console.log("Logout OK");
      }
    });
    }
    
  })
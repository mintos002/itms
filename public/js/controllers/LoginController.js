angular.module("ngItems")
// loginControler
  .controller('LoginController', function ($scope, $http, Items) {
    // heading alerts and Gif
    $scope.showAlertError = "";
    $scope.showAlertSuccess = false;
    $scope.loadingGif = false;


    $scope.logUser = function(new_login) {
      console.log("In LoginController");
      // validation
      if(new_login === undefined || new_login == null){
        $scope.showAlertError = "Please, fill the login form.";
      }
      else if(!new_login.email) {
        $scope.showAlertError = "Email missing or not valid.";
      }
      else if(!new_login.password) {
        $scope.showAlertError = "Missing password.";
      } 
      else if(new_login.password.length < 6) {
        $scope.showAlertError = "Password too short.";
      }
      else {
        // show loadingGif
        $scope.loadingGif = true;
        Items.tryLogin($scope.navbarLogged, new_login, function(success, message, data){
          if(!success){
            console.log(data);
            // hide gif
            $scope.loadingGif = false;
            // show error alert
            $scope.showAlertError = message;
            $scope.showAlertSuccess = false;
            $scope.login.password = "";
          } else {
            console.log(data);
            // hide gif
            $scope.loadingGif = false;
            // Show success alert
            $scope.showAlertSuccess = true;
            // Hide error alert
            $scope.showAlertError = "";
            // Clean form
            $scope.login = {};

            // store the token in localStorage
            token = data.token;
            firstName = data.firstName;
            window.localStorage.setItem('token', token);
            window.localStorage.setItem('firstName', firstName);

            // Redirect to profile
          }
        });

      }  
    }
  })
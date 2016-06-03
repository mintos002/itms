angular.module("ngItems")
  .controller ('AccountController', function($scope, $location, $http, Items){
    console.log("Into AccountController");
    var EMAIL = "";
    // iniciate the alerts
    $scope.showAlertError = "";
    $scope.showAlertSuccess = false;
    $scope.loadingGif = false;
    // get the token and check if the user is logged, if not, exit the account page
    var token = window.localStorage.getItem("token");
    Items.isLoggedIn(function(success, message, data){
      if(!success){
        console.log("AccountController no token.");
        $location.path("#/");
        return;
      }
    });

    // if the user is logged:
    // get user data
    Items.getUserByToken(token, function(success, message, data){
      // if an errror ocurred show the alert
      if(!success){
        $scope.showAlertError="Error while trying to load the user data. Try to refresh the site."
        return;
      }
      // if there is no error
      else {
        console.log(data);
        $scope.firstName = data.firstName;
        $scope.lastName = data.lastName;
        $scope.email = data._id;
        EMAIL = data._id;
      }
    });

    var COUNT = false;
    $scope.deleteAccount = function(){
      console.log("deleteAccount");
      // if count is false
      if(!COUNT){
        // show the alert
        $scope.showDA = true;
        $scope.deleteCode = Items.getDcode();
        COUNT = true;
      } else {
        // if the button is pressed again call to delete
        // check if the codes are the same
        if($scope.deleteCode == $scope.dcode){
          Items.deleteAccountByToken(token, function(success, message){
            if(!success){
              $scope.showAlertError = "Unable to delete the account, please try again.";
              $scope.showAlertSuccess = false;
            } else {
              $scope.deleteCode = "OK";
              window.localStorage.removeItem("token");
              window.localStorage.removeItem("firstName");
              $location.path("/");
            }
          });
        } 
        // if the code is different
        else {
          // restart code
          $scope.deleteCode = Items.getDcode();
          $scope.dcode = "";
        }
      }    
    }

    $scope.noDeleteAccount = function(){
      $scope.dcode = "";
      $scope.deleteCode = "";
      $scope.showDA = false;
      COUNT = false;
    }

    $scope.clearForm = function(){
      $scope.psws = {};
    };
    // Password management
    $scope.changePassword = function(psws){
      if(psws === undefined){
        console.log("FJDAJDSAJDJ")
        $scope.showAlertError = "Please fill the form to change the password.";
        return;
      }
      else if(EMAIL == ""){
        // show error
        $scope.showAlertError = "Unable to change the password.";
        $scope.showAlertSuccess = false;
      }
      else if(!psws.password || !psws.npassword || !psws.rnpassword) {
        $scope.showAlertError = "Missing password.";
      }
      else if(!(psws.npassword === psws.rnpassword)){
        $scope.showAlertError = "Passwords don't match.";
      } 
      else if(psws.npassword < 6) {
        $scope.showAlertError = "Password must have at least six characters.";
      }
      else {
        //if all it's OK start the loading gif and call to server
        $scope.loadingGif = true;
        Items.setPasswordByToken(psws.password, psws.npassword, function(success, message){
          // if server returns error
          if(!success){
            console.log("NO SUCCESS");
            console.log(message);
            //show the alerts
            $scope.showAlertError = message;
            $scope.showAlertSuccess = false;
            $scope.loadingGif = false;

          } else { // if the server returns success
            // show success alert
            $scope.showAlertSuccess = true;
            $scope.showAlertError = "";
            $scope.loadingGif = false;
            $scope.clearForm();
          }
        });
      }
    };

  })

angular.module("ngItems")
// signupControler
  .controller('SignupController', function ($scope, $http, Items, $location) {
    console.log("SignupController")
    
    // hide alerts and loadingGif
    $scope.showAlertError = "";
    $scope.showAlertSuccess = false;
    $scope.loadingGif = false;

    // Validation form errors
    $scope.addUser = function (new_user) {
      if(new_user === undefined || new_user == null){
        $scope.showAlertError = "Please, fill the registration form.";
      }
      else if(!new_user.firstName){
        $scope.showAlertError = "Missing first name.";
      } 
      else if(!new_user.lastName) {
        $scope.showAlertError = "Missing last name.";
      }
      else if(!new_user.email) {
        $scope.showAlertError = "Email missing or not valid.";
      }
      else if(!new_user.password || !new_user.rpassword) {
        $scope.showAlertError = "Missing password.";
      }
      else if(!(new_user.password === new_user.rpassword)){
        $scope.showAlertError = "Passwords don't match.";
      } 
      else if(new_user.password.length < 6) {
        $scope.showAlertError = "Password must have at least six characters.";
      }
      else {
        console.log("Reg form all OK");
        // If everything it's ok show loadingGif
        $scope.loadingGif = true;

        // Conect to server to register
        $http.post('user/signup', new_user)
          .then(
            // if server returns success
            function(res){
              console.log("SUCCESS user/signup");
              // Try to login
              Items.tryLogin($scope.navbarLogged, {"email": new_user.email, "password": new_user.password}, function(success, message, data) {
                if(success){
                  console.log(message);
                  // hide loadingGif
                  $scope.loadingGif = false;
                  // quit error alert message
                  $scope.showAlertError = "";
                  // add success message
                  $scope.showAlertSuccess = true;
                  // clering the form
                  $scope.add_user = {};
                  // if the browse supports local storage
                  if(typeof(Storage) !== "undefined") {
                    // Store the token and username
                    window.localStorage.setItem('token', data.token);
                    window.localStorage.setItem('firstName', data.firstName)

                    console.log(data)
                    // show loggedin navbar
                    $scope.navbarLogged = true;
                  // if the browse do not support local storage:  
                  } else {
                    alert("This site don't work with your browser. Please try with other browse.")
                    return;
                  }
                // if login is not succesful
                } else {
                  console.log(message)
                  // hide loadingGif
                  $scope.loadingGif = false;
                  // quit error alert message
                  $scope.showAlertError = "";
                  // add success message
                  $scope.showAlertSuccess = true;
                  // clering the form
                  $scope.add_user = {};
                }
              });

            },
            // if server returns error for signup
            function(res){
              console.log("ERROR user/signup");
              // hide loadingGif
              $scope.loadingGif = false;
              // show an error
              $scope.showAlertError = res.data.message;
              $scope.showAlertSuccess = false;
              // remove email & password from form
              $scope.add_user.email = ""
              $scope.add_user.password = "";
              $scope.add_user.rpassword = "";

            }
          );
      }  
    }
  })
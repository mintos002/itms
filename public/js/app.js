angular.module("ngItems", ['ngRoute', 'ui.bootstrap', 'ngMessages'])
  // configuration of our routes, it will need the $routeProvider to handle the routes, 
  // and $locationProvider to get rid of the hash(#) of the url introduced by default.
  //---------------------------------
  // CONFIG
  //---------------------------------
  .config(function($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "home.html",
        controller: "HomeController",
        
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
      
      .otherwise({
        redirectTo: "/"
      })
  })

  //---------------------------------
  // SERVICES
  //---------------------------------

  .service("Items", function($http, $location) {
    // function to get Items
    this.getItems = function() {
      return $http.get("/items").
        then(function(response) {
            return response;
        }, function(response) {
            alert("Error finding items.");
        });
    }

    this.addItem = function(item) {
      return $http.post("/items", item).
        then(function(response) {
            return response;
        }, function(response) {
            console.log("Error creating contact")
        })
    }

    this.getItem = function(itemId) {
      var url = "/items/" + itemId;
      return $http.get(url).
        then(function(response) {
            return response;
        }, function(response) {
            alert("Error finding this contact.");
        });
    }

    this.getUserByToken = function(token, callback){
      // is the token valid?
      if(token === undefined || token == null){
        // return to callback success, message, data
        callback(false, "No token given.", null);
      }
      $http.get("/user/" + token).then(
        function(response){
          console.log("In getUserByToken");
          callback(true, response.data.message, response.data.data);
        },
        function(response){
          console.log("In getUserByToken");
          callback(false, response.message, null);
        }
      );
    }

    this.tryLogin = function(vm, new_login, callback) {
      console.log("Inside tryLogin!")
      $http.post('/user/login', new_login)
        .then(
          function(response){
            console.log(response.data);
            // return to callback success, message, data
            callback(true, response.data.message, response.data.data)
            vm = true;
            $location.path('/');
          },
          function(response){
            console.log(response.data);
            // return to callback success, message, data
            callback(false, response.data.message, null)
            vm = false;
          }
        );
    }

    this.deleteAccountByToken = function(token, callback){
      console.log("Inside Delete account by token");
      $http.delete('/user/account/delete/' + token).then(
        function(response){
          callback(true, response.message);
        },
        function(response){
          callback(false, response.message)
        }
      );
    }

    this.setPasswordByEmail = function(email, opw, npw, callback){
      console.log("Inside setPasswordByEmail");
      var data = {"email" : email, "oldpassword" : opw, "newpassword" : npw}; 
      $http.post('/user/account/password', data).then(
        function(response){
          callback(true, "Password changed succesfully.");
        }, 
        function(response){
          console.log(response.data);
          callback(false, response.data.message);
        }
      );
    };

    this.getDcode = function(){
      var ch = "0123456789";
      var code = "";
      for (var i = 0; i < 6; i++) {
        code += ch[Math.floor(Math.random() * ch.length)];
      }
      return code;
    }

    this.getUserByEmail = function(vm, callback) {
      $http.get('/user')
    };

    this.getTokenByEmail = function(vm, the_email, callback) {
      console.log("Inside getTokenByEmail");
      
    }

    this.getEmailByToken = function(vm, the_token, callback){
      console.log("Inside getEmailByToken");

    }

    this.isLoggedIn = function(callback){
      var token = window.localStorage.getItem("token");
      // if there is no token
      if(token === undefined || token == null){
        // return to callback success, message, data
        callback(false, "There is no token", null);
        return;
      }
      
      $http.get('/user/isloggedin/' + token).then(
        function(response) {
          // return to callback success, message, data
          callback(true, response.data.message, response.data.data);
        },
        function(response){
          // return to callback success, message, data
          callback(false, response.data.message, null);
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("firstName");
        });
    }

    this.tryLogout = function(callback){
      var token = window.localStorage.getItem("token");
      // if there is no token
      if(token == null || token === undefined){
        console.log("No token storage to logout");
        return;
      }
      // if there is a token
      $http.delete('/user/logout/' + token).then(
        // if the user logged out from the server:
        function(response){
          console.log("SUCCESS logout");
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("firstName");
          callback(true, response.data.message, response.data.data);
          $location.path("#/");
        }, // if the server returns an error
        function(response){
          console.log("ERROR logout");
          callback(false, response.data.message, null);
        }
      );
    }

  })

  //---------------------------------
  // CONTROLLER
  //---------------------------------

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

    Items.isLoggedIn(function(success, message, data){
      if(!success){
        console.log("NO ONLINE " + message);
        $scope.navbarLogged = false;

      } else {
        console.log("YES ONLINE " + message);
        $scope.navbarLogged = true;
        $scope.nav_user_name = firstName;
      }
    });


  })

  // homeControler
  .controller('HomeController', function ($scope, itemsFactory) {
    console.log("HomeController");
    // iniciate items

    // initial min max values for filter price
    $scope.priceInfo = {
        min: 0,
        max: 1000000
    };
      
  })

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
              $location.path("#/");
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
        Items.setPasswordByEmail(EMAIL, psws.password, psws.npassword, function(success, message){
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

  // profileControler
  .controller('ProfileController', function ($scope, $location, itemsFactory, Items) {
    // check if it is logged in
    Items.isLoggedIn(function(success, message, data){
      if(!success){
        console.log("ProfileController no token.");
        $location.path("#/");
        return;
      } 
      else {
        // iniciate items
        $scope.items;

        // initial min max values for filter price
        $scope.priceInfo = {
          min: 0,
          max: 1000000
        };

        // Push Items
        $scope.newListing = {};

        $scope.addItem = function(newListing) {
          newListing.image = 'default-img';
          $scope.items.push(newListing);
          // to clear the form:
          $scope.newListing = {};
        }

        // Eddit items
        $scope.editItem = function(item) {
          // open the form in the home.html
          $scope.editListing = true;
          $scope.existingListing = item;
        }

        // Save item edit
        $scope.saveItemEdit = function() {
          // void the data in the edit form and close it
          $scope.existingListing = {};
          $scope.editListing = false;
        }

        // Delete an item
        // taking current listing, find the index, and splice it out
        $scope.deleteItem = function(listing) {
          var index = $scope.items.indexOf(listing);
          $scope.items.splice(index, 1);
          $scope.existingListening = {};
          $scope.editListing = false;
        }

        // Get the items from itemsFactory
        itemsFactory.getItems().success(function (data) {
          // if it success:
          $scope.items = data;
        }).error(function (error) {
          // if there is an error
          console.log("ERROR in HomeController");
        });        
      }
    });   
  });







/*    .service("Contacts", function($http) {
      this.getContacts = function() {
          return $http.get("/contacts").
              then(function(response) {
                  return response;
              }, function(response) {
                  alert("Error finding contacts.");
              });
      }
      this.createContact = function(contact) {
          return $http.post("/contacts", contact).
              then(function(response) {
                  return response;
              }, function(response) {
                  alert("Error creating contact.");
              });
      }
      this.getContact = function(contactId) {
          var url = "/contacts/" + contactId;
          return $http.get(url).
              then(function(response) {
                  return response;
              }, function(response) {
                  alert("Error finding this contact.");
              });
      }
      this.editContact = function(contact) {
          var url = "/contacts/" + contact._id;
          console.log(contact._id);
          return $http.put(url, contact).
              then(function(response) {
                  return response;
              }, function(response) {
                  alert("Error editing this contact.");
                  console.log(response);
              });
      }
      this.deleteContact = function(contactId) {
          var url = "/contacts/" + contactId;
          return $http.delete(url).
              then(function(response) {
                  return response;
              }, function(response) {
                  alert("Error deleting this contact.");
                  console.log(response);
              });
      }
  })
  .controller("ListController", function(contacts, $scope) {
      $scope.contacts = contacts.data;
  })
  .controller("NewContactController", function($scope, $location, Contacts) {
      $scope.back = function() {
          $location.path("#/");
      }

      $scope.saveContact = function(contact) {
          Contacts.createContact(contact).then(function(doc) {
              var contactUrl = "/contact/" + doc.data._id;
              $location.path(contactUrl);
          }, function(response) {
              alert(response);
          });
      }
  })
  .controller("EditContactController", function($scope, $routeParams, Contacts) {
      Contacts.getContact($routeParams.contactId).then(function(doc) {
          $scope.contact = doc.data;
      }, function(response) {
          alert(response);
      });

      $scope.toggleEdit = function() {
          $scope.editMode = true;
          $scope.contactFormUrl = "contact-form.html";
      }

      $scope.back = function() {
          $scope.editMode = false;
          $scope.contactFormUrl = "";
      }

      $scope.saveContact = function(contact) {
          Contacts.editContact(contact);
          $scope.editMode = false;
          $scope.contactFormUrl = "";
      }

      $scope.deleteContact = function(contactId) {
          Contacts.deleteContact(contactId);
      }
  }); */


    
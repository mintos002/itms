angular.module("ngItems")
.service("Items", function($http, $location, $anchorScroll) {
    // function to get Items
    this.getItems = function(callback) {
      $http.get("/items/all").
        then(function(response) {
            callback(true, response.data.message, response.data.data);
        }, 
        function(response) {
          callback(false, response.message, null);
        });
    }

    this.getItemsByToken = function(token, callback){
      // check if there is a token
      var token = token;
      if(token == null || token === undefined){
        callback(false, "No token provided", null);
        return;
      }
      // if token is valid
      $http.get("/items/" + token).then(
        function(response){
          callback(true, response.data.message, response.data.data);
        },
        function(response){
          callback(false, response.data.message, null);
        }
      );
    }

    this.getLikedItemsByToken = function(token, callback){
      // check if there is a token
      var token = token;
      if(token == null || token === undefined){
        callback(false, "No token provided", null);
        return;
      }
      // if token is valid
      $http.get("/items/liked/" + token).then(
        function(response){
          callback(true, response.data.message, response.data.data);
        },
        function(response){
          callback(false, response.data.message, null);
        }
      );
    }

    this.removeLike = function(itemId, callback){
      // check if there is a token and a itemId
      var token = window.localStorage.getItem("token");
      if(itemId === undefined || token === undefined){
        callback(false, "You are not logged in.", null);
        return;
      } // if the data is valid, send to server
      $http.delete("/items/like/" + token + "/" + itemId).then(
        function(response){ // if server returns success
          callback(true, response.data.message, response.data.data);
        },
        function(response){ // if server returns fail
          callback(false, response.data.message, null);
        }
      );
    }

    this.addLike = function(itemId, callback){
      // check if there is a token and a itemId
      var token = window.localStorage.getItem("token");
      if(itemId === undefined || token === undefined){
        callback(false, "You are not logged in.", null);
        return;
      } // if the data is valid, send to server
      $http.post("/items/like", {"itemId" : itemId, "token": token}).then(
        function(response){ // if server returns success
          callback(true, response.data.message, response.data.data);
        },
        function(response){ // if server returns fail
          callback(false, response.data.message, null);
        }
      );
    }

    this.addItem = function(item, callback) {
      if(!item){
        callback(false, "No item provided.", null)
        return;
      }
      var token = window.localStorage.getItem("token");
      if(token === undefined){
        callback(false, "You are not logged in.", null);
        return;
      }
      // add the owner to item
      data = {"token": token, "item": item}
      $http.post("/items", data).then(
        function(response) {
          console.log("Success addItem");
          callback(true, response.data.message, response.data.data);
        },
        function(response) {
          console.log("Error creating contact");
          callback(false, response.data.message, null);
        }
      );
    }

    this.saveItemEdit = function(item, callback){
      if(!item){
        callback(false, "No item provided.", null)
        return;
      }
      var token = window.localStorage.getItem("token");
      if(token === undefined){
        callback(false, "You are not logged in.", null);
        return;
      }
      // add the owner to item
      data = {"token": token, "item": item}
      //call the server
      $http.post("/items/edit", data).then(
        function(response) {
          callback(true, response.data.message, response.data.data);
        },
        function(response) {
          callback(false, response.data.message, null);
        }
      )
    }

    this.deleteItem = function(item_id, callback) {
      var token = window.localStorage.getItem("token");
      // check if the data is valid
      if(token === undefined || !item_id){
        callback(false, "No data provided.");
      } else {
        // if the data is valid call the server
        $http.delete("/items/delete/" + token +"/" + item_id).then(
          function(response){
            callback(true, response.data.message);
          },
          function(response){
            callback(false, response.data.message);
          }
        );
      }
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
          callback(false, response.data.message, null);
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
          callback(true, response.data.message);
        },
        function(response){
          callback(false, response.data.message)
        }
      );
    }

    this.setPasswordByToken = function(opw, npw, callback){
      console.log("Inside setPasswordByToken");
      var token = window.localStorage.getItem("token");
      // is the token valid?
      if(token === undefined || token == null){
        // return to callback success, message, data
        callback(false, "No token given.", null);
      }
      var data = {"token": token, "oldpassword" : opw, "newpassword" : npw}; 
      $http.post('/user/account/password', data).then(
        function(response){
          callback(true, response.data.message);
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

    this.scrollTo = function(id){
      // set the location.hash to the id of the element
      $location.hash(id)
      //call anchorScroll()
      $anchorScroll();
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

  });

angular.module("ngItems")
 // homeControler
  .controller('HomeController', function ($scope, Items) {
    console.log("HomeController");
    // init email constant
    var EMAIL = "";
    // initial min max values for filter price
    $scope.priceInfo = {
        min: "0",
        max: "1000"
    };
    // init alerts
    $scope.showAlertError = "";
    $scope.showAlertSuccess = "";

    //check if the user is logged in to show logged privileges
    Items.isLoggedIn(function(success, message, data){
      if(!success){
        // if the user is not logged in, don't show interested button
        $scope.loggedIn = false;
        return;
      } else {
        // if the user is logged in, show the button and save te email
        $scope.loggedIn = true;
        EMAIL = data.email;
      }
    });

    $scope.imInterested = function(item){
      console.log(item)
      // Add like to the item by the current user
      var itemId = item._id;
      $scope.showInId = itemId;
      console.log(itemId)
      Items.addLike(itemId, function(success, message, data){
        if(!success){ // if there is an error, show an alert
          $scope.showAlertItemError = message; 
          $scope.showAlertItemSuccess = "";
        } 
        else {
          // show a success alert
          $scope.showAlertItemError = "";
          $scope.showAlertItemSuccess = message;
        }
      });
      
    }

    // init items array
    $scope.items;
    // get items
    Items.getItems(function(success, message, data){
      if(!success) {
        // if server returns no success show alert error
        $scope.showAlertError = message;
        $scope.showAlertSuccess = "";
      } else {
        // if
        $scope.items = data;
      }
    });
      
  })

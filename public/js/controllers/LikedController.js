angular.module("ngItems")
  .controller("LikedController", function ($scope, $location, Items){
    console.log("In LikedController")
    // initial min max values for filter price
    $scope.priceInfo = {
      min: "0",
      max: "1000"
    };
    // check if the user is logged in
    Items.isLoggedIn(function(success, message, data){
      if(!success){
        console.log("LikedController no token.");
        $location.path("#/");
        return;
      } 
      else {
        // iniciate items
        $scope.items;

        $scope.unlike = function(item){
          console.log(item)
          // Add like to the item by the current user
          var itemId = item._id;
          $scope.showInId = itemId;
          console.log(itemId)
          Items.removeLike(itemId, function(success, message, data){
            if(!success){ // if there is an error, show an alert
              $scope.showAlertItemError = message; 
              $scope.showAlertItemSuccess = "";
              getTheItems();
            } 
            else {
              // show a success alert
              $scope.showAlertItemError = "";
              $scope.showAlertItemSuccess = "";
              getTheItems();
            }
          });
          
        }

        // Get the items from the db
        var token = window.localStorage.getItem("token");
        getTheItems = function(){
          console.log("getTheItems")
          Items.getLikedItemsByToken(token, function (success, message, data) {
            if(!success){
              // if there is an error show the error
              $scope.items = {};
              console.log(message);
              $scope.showAlertError = message;
            } 
            else{
              // if it success:
              console.log(data)
              $scope.items = data;
              console.log(data);
            }
          }); 
        }
        getTheItems();
      };
    })//is logged in
  });

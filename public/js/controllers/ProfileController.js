angular.module("ngItems")
    // profileControler
  .controller('ProfileController', function ($scope, $location, Items) {
    var EMAIL = "";
    // initial min max values for filter price
    $scope.priceInfo = {
      min: "0",
      max: "1000"
    };
    // check if it is logged in
    Items.isLoggedIn(function(success, message, data){
      if(!success){
        console.log("ProfileController no token.");
        $location.path("#/");
        return;
      } 
      else {
        // store the email
        EMAIL = data.email;
        console.log(EMAIL);

        // iniciate items
        $scope.items;
        // iniciate search
        $scope.showSearch = true;

        // Push Items
        $scope.newListing = {};

        $scope.addItem = function(newListing) {
          // if there is no image:
          if(!newListing.image){
            newListing.image = 'default-img';
          }
          if(!newListing.likes){
            newListing.likes = [];
          }
          // comprove all the data is in
          if(newListing == null || newListing === undefined){
            $scope.showAlertErrorAddItem = "Please, fill the form.";
            return;
          } else if(!newListing.price){
            $scope.showAlertErrorAddItem = "Price missing.";
            return;
          } else if(!newListing.title){
            $scope.showAlertErrorAddItem = "Title missing.";
            return;
          } else if(!newListing.type){
            $scope.showAlertErrorAddItem = "Department missing.";
            return;
          } else if(!newListing.description){
            $scope.showAlertErrorAddItem = "Description missing.";
            return;
          } else {
            $scope.showAlertErrorAddItem = "";
            // add the item to the db
            Items.addItem(newListing, function(success, message, data){
              if(!success){
                $scope.showAlertError = "Unable to add the item, please, refresh the site and try again.";
                return;
              } else {
                // if server return success:
                //For an instant loading, push the data to the html file
                //$scope.items.push(newListing);
                // to clear the form:
                $scope.newListing = {};
                // restart the view:
                getTheItems();
                
              }
            });
          }
        }

        // Eddit items it copies the item to the edit section
        $scope.editItem = function(item) {
          // open the form in the home.html
          $scope.editListing = true;
          $scope.existingListing = item;
          
          //Items.scrollTo("edit_item");
        }

        // Save item edit
        $scope.saveItemEdit = function() {
          // void the data in the edit form and close it
          var existingListing = $scope.existingListing;
          // comprove all the data is in
          if(existingListing == null || existingListing === undefined){
            $scope.showAlertErrorEditItem = "Please, fill the form.";
            return;
          } else if(!existingListing.price){
            $scope.showAlertErrorEditItem = "Price missing.";
            return;
          } else if(!existingListing.title){
            $scope.showAlertErrorEditItem = "Title missing.";
            return;
          } else if(!existingListing.type){
            $scope.showAlertErrorEditItem = "Department missing.";
            return;
          } else if(!existingListing.description){
            $scope.showAlertErrorEditItem = "Description missing.";
            return;
          } else if(!existingListing.owner){
            $scope.showAlertErrorEditItem = "Unable to update the item, please, refresh the site and try again.";
            return;
          } else if(!existingListing._id){
            $scope.showAlertErrorEditItem = "Unable to update the item, please, refresh the site and try again.";
            return;
          } else {
            Items.saveItemEdit(existingListing, function(success, message, data){
              if(!success){
                $scope.showAlertErrorEditItem = "Unable to update the item, please, refresh the site and try again.";
                return;
              } else {
                // clear and hide the edit form
                $scope.existingListing = {};
                $scope.editListing = false;
                // get the Items to actualizate
                getTheItems();
              }
            })
          }
        }

        // Delete an item
        // taking current listing, find the index, and splice it out
        $scope.deleteItem = function(listing) {
          Items.deleteItem(listing._id, function(success, message){
            if(!success){
              // if callback returns fail, show the error
              $scope.showAlertErrorEditItem = message;
              return;
            } else {
              // if it success, clear the form closeit and get the items.
              $scope.existingListening = {};
              $scope.editListing = false;
              getTheItems();
            }
          })          
        }

        // Get the items from the db
        var token = window.localStorage.getItem("token");
        getTheItems = function(){
          console.log("getTheItems")
          Items.getItemsByToken(token, function (success, message, data) {
            if(!success){
              // if there is an error show the error
              $scope.items = {};
              $scope.showAlertError = message;
            } 
            else{
              // if it success:
              $scope.items = data;
            }
          }); 
        }
        // get the items
        getTheItems();    
      }
    });   
  })


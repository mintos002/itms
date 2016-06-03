var express = require("express");
var fs = require("fs")
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bcrypt = require("bcryptjs");


// Variables
var ALLITEMS_COLLECTION = "items";
var LIKEDITEMS_COLLECTION = "likeditems"
var USERS_COLLECTION = "users";
var UONLINE_COLLECTION = "usersOnline";
var NSALT = 10;
var URLENC = bodyParser.urlencoded({ extended: true });
//server config
var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Content-Type", "application/json; charset=utf-8");
  next();
});

// ----------------------------------------------------
// CONNECTION TO DB
// ----------------------------------------------------

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;
var URI = "mongodb://heroku_p3lgr1x0:eg1phk01stdfh3crhi4v72vsdi@ds023932.mlab.com:23932/heroku_p3lgr1x0";
//var URI = process.env.MONGODB_URI;

// Connect to the database before starting the application server. 
mongodb.MongoClient.connect(process.env.MONGODB_URI || URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);

  // Define token as unique key into the db
  db.collection(UONLINE_COLLECTION).createIndex({ "token" : 1 },{ unique : true });

  });
});


// ----------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("handleError: " + reason);
  res.status(code || 500).json({"success": false, "message": message});
}

// Token generator
function getToken() {
  var ch = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  var token = "";
  for (var i = 0; i < 36; i++) {
    token += ch[Math.floor(Math.random() * ch.length)];
  }
  return token;
}

// Mongodb query
function mongoInsert (res, coll, data, callback) {
  console.log("In mongoInsert");
  db.collection(coll).insert(data, function(err, doc) {
    callback(err,doc);
  })
};

function mongoFind(res,coll, data, callback){
  console.log("In mongoFind");
  db.collection(coll).find(data).toArray(function(err,doc){
    callback(err, doc);
  });
}

function mongoRemove(res, coll, data, callback){
  console.log("In mongoRemove");
  db.collection(coll).remove(data, function(err,doc){
    callback(err,doc);
  });
}

function mongoUpdate(res, coll, find, change, callback){
  console.log("In mongoUpdate");
  db.collection(coll).update(find, {$set: change}, function(err, doc){
    callback(err, doc);
  });
}

function mongoUpdateArray(res, coll, find, change, callback){
  console.log("In mongoUpdate");
  db.collection(coll).update(find, {$push: change}, function(err, doc){
    callback(err, doc);
  });
}

function mongoUpdateArrayDelete(res, coll, find, change, callback){
  console.log("In mongoUpdate");
  db.collection(coll).update(find, {$pull: change}, function(err, doc){
    callback(err, doc);
  });
}
// this function checks if the user is logged in and if it is,
// it returns the email
function isLoggedIn(res, token, callback){
  console.log("In isLoggedIn")
  // Check if the token is a valid data, if not send an error
  if(token === undefined || token == null || token == {} || token == ""){
    handleError(res, "isLoggedIn", "You are not logged in.", 404);
    res.end();
    callback(false, null);
    return;
  }
  // if data is valid, check if the user is online
  mongoFind(res, UONLINE_COLLECTION, {"token" : token}, function(err, doc) {
    // if there is an error, throw an error to client
    if(err){
      if(err){
        handleError(res, "isLoggedIn", "Unexpected error.");
        res.end();
        callback(false, null);
      } 
    }
    // if there is no error compare tokens and send the user email
    else { 
      if(doc[0] === undefined || doc[0] == {} || doc[0] == null){
        handleError(res, "isLoggedIn", "You are not logged in.", 404);
        res.end();
        callback(false);
      } else {
      var email = doc[0]._id;
      callback(true, email);
      }
    }
  });
}

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// USER SIGNUP

/*  "/user/signup"
 *    POST: sends the signup info
 */
app.post("/user/signup", function(req, res) {
  console.log("SERVER /user/signup")

  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  // check if the data is valid and if the lenght of the password is correct
  if(!(firstName || lastName || email || password) || password.length <6) {
    handleError(res, "Invalid user input", "Incorrect data provided, please, try again.", 400);
    res.end();
    return;
  }

  // crypt password
  bcrypt.hash(password, NSALT, function(error, hash) {
    if(error){
      handleError(res, "Error comparing bcrypt", "Unexpected error.");
      res.end();
      return;
    }
    // to evoid repeating users, the _id will be the email
    // in a mongodb an _id is a unique index.
    var user = {firstName, lastName, _id: email, hash};
    
    mongoInsert(res, USERS_COLLECTION, user, function(err, docs) {
      if(err) {
        if(err.code == 11000){
          handleError(res, err, "You are already registered.");
          res.end();
          return;
        } else {
          handleError(res, err, "Unexpected error, please try again later.");
          res.end();
          return;
        }
        
      } else {
        res.status(201).json({"success" : true, "message": "New user registered."});
        res.end();
        return;
      }
    });
  });
});

// USER LOGIN

/*  "/user/login"
 *    POST: sends the login
 */
app.post("/user/login", function(req, res) {
  console.log("Server /user/login")
  // get the request
  var us = req.body.email;
  var pw = req.body.password;
  // check if the data is valid
  if (us === undefined || pw === undefined) {
    handleError(res, "user or pswrd undefined", "User or/and password undefined.", 400);
    res.end();
    return;
  } else {
    // if the data is valid check if the user is registered
    mongoFind(res,USERS_COLLECTION, {"_id":us}, function(err, doc){
      if(err){
        handleError(res, err.message, "Error while conecting to db.");
        res.end();
        return;
      } 
      else {
        var user = doc[0];
        // Comprove data
        if (user === undefined) {
          handleError(res, "User does not exist.", "Email or password incorrect.", 404);
          res.end();
          return;
        } 
        else { 
          // user exists, compare the hashed password
          var pwdb = user.hash;
          bcrypt.compare(pw, pwdb, function(error, result){
            if(error){
              handleError(res, "Error comparing bcrypt pswrds", "Error connecting to db.");
              res.end();
              return;
            } 
            else {
              if (!result){
                handleError(res, "Error comparing bcrypt pswrds", "Email or password incorrect.", 404);
                res.end();
                return;
              }
              else {
                // Generate token and save it
                var token = getToken();
                var data = {"_id": us, "token":token};

                mongoInsert(res, UONLINE_COLLECTION, data, function(err, doc){
                  if (err) {
                    // if the error inserting data is 11000 => data already exists
                    // so we need to remove the data to login again.
                    if(err.code == 11000){
                      mongoRemove(res, UONLINE_COLLECTION, {"_id" : us}, function(error,result){
                      if(error){
                        handleError(res, "DB ERROR REMOVE", "Unexpected error.");
                        res.end();
                        return;
                      } // else
                      handleError(res, "DB SUCCESS REMOVE", "You are already logged in, please try again to login.");
                      res.end();
                      return;
                      });
                    } 
                    // if the error is not 11000
                    else {
                      handleError(res, err.message, "Unexpected error.");
                      res.end();
                      return;
                    }
                  } 
                  // if there is no error at all
                  else {
                    console.log("OK, user: " + us + " joined to usersOnline");
                    res.status(201).json({"success": true, "message": "Successfully logged in.", "data": {"firstName" : user.firstName ,"token" : token}});
                    res.end();
                  }
                }); // db insert token
              }// Creating token
            } // bcrypt no error
          }); // bcrypt comparation
        }// USER EXISTS
      } // NO db error getting user
    }); // get user connection to db
  } // us pw no undefined

}); // END /user/login

// USER LOGOUT

/*  "/user/logout"
 *    DELETE: sends the logout
 */
app.delete("/user/logout/:token", function(req, res){
  var token = req.params.token;
  //var token = req.body.token;
  // check if the user is logged in
  isLoggedIn(res, token, function(success, email){
    if(success) {
      mongoRemove(res, UONLINE_COLLECTION, {'token': token}, function(err, result) {
        if(err) {
          handleError(res, "DB ERROR /user/logout " + err.code, "Unexpected error trying to logout.");
          res.end();
          return;
        } else {
          console.log("DB SUCCESS /user/logout");
          res.status(200).json({"success": true, "message": "Successfully logged out."});
          res.end();
        }
      });
    }
  }); 
});

// GET USER BY TOKEN

/*  "/user"
 *    GET: user by token
 */
app.get("/user/:token", function(req,res){
  var token = req.params.token;
  // check if the user is logged in
  isLoggedIn(res, token, function(success, email){
    if(success){
       mongoFind(res, USERS_COLLECTION, {"_id" : email}, function(erro, docs){
        // if db returns error
        if(erro){
          handleError(res, "DB ERROR /user/:token: ", "Unexpected error.");
          res.end();
          return;
        } // if db returns success
        else {
          var user = docs[0];
          delete user.hash;
          // if there is no user:
          if(user === undefined) {
            handleError(res, "DB ERROR /user/:token: ", "User not found.", 404);
            res.end();
            return;
          }
          // if there is a user
          res.status(200).json({"success" : true, "message" : "The user is: " + user.email, "data" : user});
          res.end();
        }

      });
    }
  });
  
});

// USER LOGGED IN?

/*  "/user/isloggedin"
 *    GET: checks the isloggedin
 */
 app.get("/user/isloggedin/:token", function(req, res) {
  // get the request
  var token = req.params.token;
  console.log("adddhfshifasdh")
  // check if it's logged in with isLoggedIn method
  isLoggedIn(res, token, function(success, email){
    if(success){
      // if user is logged in:
      res.status(200).json({"success" : true, "message": "You are logged in.", "data" : {"email" : email}});
      res.end();
    }
  });
 });

 // USER DELETE ALL ACCOUNT

/*  "/user/account/delete"
 *    DELETE: delete all where user is in
 */
 app.delete("/user/account/delete/:token", function(req,res){
  var token = req.params.token;
  var email = "";
  // show if user is logged in
  isLoggedIn(res, token, function(success, email){
    if(success){ // if the user is logged in:
      // if the email is correct start removeing data:
      // remove your items
      mongoRemove(res, ALLITEMS_COLLECTION, {"owner" : email}, function(err, result){
        if(err){
          handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
          res.end();
          return;
        }
      });// mongoRemoveItems
      // logout
      mongoRemove(res, UONLINE_COLLECTION, {"_id" : email}, function(err, result){
        if(err){
          handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
          res.end();
          return;
        }
      })// mongoRemoveUOnline
      // remove your profile
      mongoRemove(res, USERS_COLLECTION, {"_id" : email}, function(err, result){
        if(err){
          handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
          res.end();
          return;
        }
      })// mongoRemoveUOnline
      // if all went ok 
      res.status(200).json({"success": true, "message": "Account successfully deleted."});
      res.end();
      return;
    } // end success
  });
 });

// USER CHANGE PASSWORD

/*  "/user/account/password"
 *    POST: changes the password
 */
 app.post("/user/account/password", function(req,res){
    console.log("Into user/account/password");
    var opw = req.body.oldpassword;
    var npw = req.body.newpassword;
    var token = req.body.token;

    // check the token
    isLoggedIn(res, token, function(success, email){
      if(success){ // if user is logged in:
        // make sure there are valid
        if(opw === undefined || npw === undefined || email === undefined){
          handleError(res, "ERROR user/account/password: invalid data.", "Incorrect data.")
          res.end();
          return;
        }
        // check if the oldpassword the is correct one
        mongoFind(res, USERS_COLLECTION, {"_id" : email}, function(err, doc){
          if(err){
            // if thre is an error, throwit
            handleError(res, err.message, "Unexpected error.");
            res.end();
            return;
          } else {
            // if there is no error, compare the oldpassword, if it matches
            // crypt the new password and store it, else throw error
            bcrypt.compare(opw, doc[0].hash, function(erro,resu) {
              if(erro){
                handleError(res, "BCRYPT ERROR", "Unexpected error.");
                res.end();
                return;
              } else {
                // if there is no result
                if(!resu){
                  handleError(res, "BCRYPT ERROR not result", "Incorrect password.");
                  res.end();
                  return;
                } else {
                  // if password is ok crypt the newone and save it:
                  // crypt password
                  bcrypt.hash(npw, NSALT, function(error, hash) {
                    if(error){
                      handleError(res, "Error comparing bcrypt", "Unexpected error.");
                      res.end();
                      return;
                    } // if there is no error set the psw
                    var find = {"_id" : email};
                    var change = {"hash" : hash};
                    mongoUpdate(res, USERS_COLLECTION, find, change, function(err, count){
                      console.log("MongoUpdate");
                      if(err){
                        handleError(res, "DB ERROR: mongoUpdate", "Password not changed, please try again.");
                        res.end();
                        return;
                      } else {
                        console.log("SUCCESS password changed")
                        res.status(200).json({"success" : true, "message" : "Password successfully changed."});
                        res.end();
                      }
                    }); //mongo update
                  });// bcrypt 2
                }// psw match
              }// psw no error
            });// bcrypt 1
          }// user find no error
        });
      }
    }) 
 });

// ITEMS API ROUTES BELOW

// GET ALL ITEMS

/*  "/items/all"
 *    GET: finds all items
 */
app.get("/items/all", function(req, res) {
  mongoFind(res, ALLITEMS_COLLECTION, {}, function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get items");
      res.end();
      return;
    } else {
      if (docs[0] == null || docs[0] === undefined){
        handleError(res, "ERROR No items found", "No items found.");
        res.end();
        return;
      }
      res.status(200).json({"success": true, "message": "Items found.", "data": docs});
      res.end();
    }
  });
});

// GET ONLY THE USER ITEMS

/*  "/items/:token"
 *    GET: finds items by token
 */
app.get("/items/:token", function(req, res){
  var token = req.params.token;
  // check if there is a token
  isLoggedIn(res, token, function(success, email){
    if(!success){
      return;
    }
    // find the items for this email
    mongoFind(res, ALLITEMS_COLLECTION, {"owner": email}, function(er, docs){
      if(er){
        handleError(res, er.massage, "Unexpected error.");
        res.end();
        return;
      } else {
        // the docs are empty?
        if(docs[0] == null || docs[0] === undefined){
          handleError(res, "ERROR emailByToken, no data found allitems", "You have no items. Add an Item now and start selling!", 404);
          res.end();
          return;
        } else {
          // send the data
          res.status(200).json({"success": true, "message": "Items found.", "data": docs});
          res.end();
        }// docs found
      }// else there is no error
    });// mongo find2
  })
});

// ADD AN ITEM

/*  "/items"
 *    POST: add an item
 */
app.post("/items", function(req, res) {
  var newItem = req.body.item;
  var token = req.body.token;

  // See if user is loggedin
  isLoggedIn(res, token, function(success, email){
    if(!success){
      return;
    }
    if (newItem === undefined || newItem == null) {
      handleError(res, "Invalid user input", "No data provided.", 400);
      res.end();
      return;
    }
    // Ad the email to the item
    newItem.owner = email;

    mongoInsert(res, ALLITEMS_COLLECTION, newItem, function(err, doc) {
      if(err) {
        handleError(res, err.message, "Failed to create new item.");
        res.end();
        return;
      } else {
        res.status(201).json({"success": true, "message": "Item successfully added.", "data": doc[0]});
        res.end();
      }
    })
  })
});

// EDIT AN ITEM

/*  "/items/edit"
 *    POST: update an item
 */
app.post("/items/edit", function(req, res){
  var item = req.body.item;
  var token = req.body.token;

  // check if it's logged in
  isLoggedIn(res, token, function(success, email){
    if(!success){
      return;
    }
    // check if the body is valid if not return handle error
    if(item == null || item === undefined || !item._id){
      handleError(res, "ERROR /items/edit invalid item", "Item not valid, please, restart the site and try it again.");
      res.end();
      return;
    }
    // if item is valid then updateit.
    var id = new mongodb.ObjectID(item._id);
    var data = item;
    delete data._id;

    mongoUpdate(res, ALLITEMS_COLLECTION, {"_id": id}, data, function(err, doc){
      if(err){
        handleError(res, "ERROR /items/edit invalid item", "Unexpected error.");
        res.end();
        return;
      }
      // if there is no error, send success
      console.log("success edit")
      res.status(200).json({"success": true, "message": "Item succesfully updatet.", "data": doc});
      res.end();
      return;
    })
  });
  
});

// DELETE AN ITEM

/*  "/items/delete/:token"
 *   DELETE: delete the contact
 */
app.delete("/items/delete/:token/:item_id", function(req, res){
  var token = req.params.token;
  var item_id = req.params.item_id;
  
  // check if it's logged in
  isLoggedIn(res, token, function(success, email){
    if(!success){
      return;
    }
    // if it success:
    // to make sure that the token send is from the owner of the object:
    var id = new mongodb.ObjectID(item_id);
    var data = {"_id": id, "owner": email};
    data._id = id;

    mongoRemove(res, ALLITEMS_COLLECTION, data, function(error, result){
      if(error){
        handleError(res, error.message, "Unable to remove the item, please, restart the site and try again.");
        res.end();
        return;
      } else {
        res.status(200).json({"success": true, "message": "Item successfully removed."});
        res.end();
      }
    })
  });
});

// GET LIKED ITEMS

/*  "/items/liked/:token"
 *    GET: finds items by token
 */
app.get("/items/liked/:token", function(req, res){
  var token = req.params.token;
  // if token is invalid
  isLoggedIn(res, token, function(success, email){
    if(success){
      // if there is an email search items where likes == to current email
      mongoFind(res, ALLITEMS_COLLECTION, {"likes" : email}, function(er, docs){
        if(er){
          // if error, thorw error
          handleError(res, err.message, "Unexpected error, please, restart the site and try again.");
          res.end();
          return;
        }
        // if there is no error, check if the doc exists:
        // the docs are empty?
        if(docs[0] == null || docs[0] === undefined){
          handleError(res, "ERROR /items/liked/:token no data found", "You have no liked items.", 404);
          res.end();
          return;
        } else {
          // send the data
          res.status(200).json({"success": true, "message": "Items found.", "data": docs});
          res.end();
        }// docs found
      
      });
    }
  })
});

// LIKE AN ITEM

/*  "/items/liked/"
 *    post: update likes
 */
app.post("/items/like", function(req, res){
  // get the req
  var item_id = req.body.itemId;
  var token = req.body.token;

  if(item_id == {} || item_id === undefined){
    handleError(res, "ERROR /items/like invalid data", "Data not valid, please, restart the site and try it again.");
    res.end();
    return;
  }
  // call isLoggedIn function
  isLoggedIn(res, token, function(success, email){
    if(success){
      // if it is logged in:
      if(email == null){
        handleError(res, "ERROR no email", "Unexpected error.");
        res.end();
        return;
      }

      var id = new mongodb.ObjectID(item_id);

      mongoFind(res, ALLITEMS_COLLECTION, {"_id": id, "likes": email}, function(err, docs){
        if(err){
          handleError(res, "ERROR /items/like invalid item", "Unexpected error.");
          res.end();
          return;
        }
        if(docs[0]){
          res.status(200).json({"success": true, "message": "Item already in your liked items.", "data": docs});
          res.end();
          return;
        } else {
          mongoUpdateArray(res, ALLITEMS_COLLECTION, {"_id": id}, {"likes" : email}, function(err, doc){
            if(err){
              handleError(res, "ERROR /items/like invalid item", "Unexpected error.");
              res.end();
              return;
            }
            // if there is no error, send success
            res.status(200).json({"success": true, "message": "Item added to your liked items.", "data": doc});
            res.end();
            return;
          })
        }
      });  
    }
  });//islogedin
});

// UNLIKE AN ITEM

/*  "/items/liked/:token/:itemid"
 *    DELETE: update likes
 */
 app.delete("/items/like/:token/:itemId", function(req, res){
  // get the req
  var item_id = req.params.itemId;
  var token = req.params.token;

  if(item_id == {} || item_id === undefined){
    handleError(res, "ERROR /items/like/:token/:itemId", "Data not valid, please, restart the site and try it again.");
    res.end();
    return;
  }
  // call isLoggedIn function
  isLoggedIn(res, token, function(success, email){
    if(success){
      // if it is logged in:
      if(email == null){
        handleError(res, "ERROR no email", "Unexpected error.");
        res.end();
        return;
      }

      var id = new mongodb.ObjectID(item_id);

      mongoUpdateArrayDelete(res, ALLITEMS_COLLECTION, {"_id": id}, {"likes" : email}, function(err, doc){
        if(err){
          handleError(res, "ERROR /items/like/:token/:itemId", "Unexpected error.");
          res.end();
          return;
        }
        // if there is no error, send success
        res.status(200).json({"success": true, "message": "Item removed from your liked items.", "data": doc});
        res.end();
        return;
      })  
    }
  });//islogedin
  
});
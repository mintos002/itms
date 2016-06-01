var express = require("express");
var fs = require("fs")
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bcrypt = require("bcryptjs");
//var laLogica = require('logic/logic.js')

// Variables
var ALLITEMS_COLLECTION = "items";
var USERS_COLLECTION = "users";
var UONLINE_COLLECTION = "usersOnline";
var NSALT = 10;
var URLENC = bodyParser.urlencoded({ extended: true });
//use conf
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


// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------
/*  "/user/signup"
 *    POST: sends the signup info
 */
app.post("/user/signup", function(req, res) {
  console.log("SERVER /user/signup")

  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;
  console.log(firstName);
  console.log(req);

  // if data is invalid:
  if(!(firstName || lastName || email || password)) {
    handleError(res, "Invalid user input", "No data provided.", 400);
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
        console.log("signup stored!!")
        res.status(201).json({"success" : true, "message": "New user registered."});
        res.end();
        return;
      }
    });
  });
});


/*  "/user/login"
 *    POST: sends the login
 */
app.post("/user/login", function(req, res) {
  console.log("Server /user/login")
  
  var us = req.body.email;
  var pw = req.body.password;
  if (us === undefined || pw === undefined) {
    handleError(res, "user or pswrd undefined", "User or/and password undefined.", 400);
    res.end();
    return;
  } else {
    
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
          // USER EXISTS!
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
                    // so we need to remove the data to login again
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

/*  "/user/logout"
 *    DELETE: sends the logout
 */

app.delete("/user/logout/:token", function(req, res){
  var token = req.params.token;
  //var token = req.body.token;

  if(!token) {
    handleError(res, "DB ERROR /user/logout no token send.", "You are not logged in.");
    res.end();
    return;
  }

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


});

/*  "/user"
 *    GET: user by token
 */
app.get("/user/:token", function(req,res){
  var token = req.params.token;
  // check if it's a valid request
  if(token == undefined || token == null){
    handleError(res, "ERROR /user/:token: Undefined or Null", "You are not logged in.", 404);
    res.end();
    return;
  }
  // search the email by token
  mongoFind(res, UONLINE_COLLECTION, {"token" : token}, function(err,doc){
    // if db returns error
    if(err){
      handleError(res, "DB ERROR /user/:token: ", "Unexpected error.");
      res.end();
      return;
    } // if db returns success
    else {
      // if there is no result:
      if(doc[0] === undefined){
        handleError(res, "DB ERROR /user/:token: ", "You are not logged in.");
        res.end();
        return;
      } 
      // if there is a result, get the email and find the user:
      var email = doc[0]._id;
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


/*  "/user/isloggedin"
 *    GET: checks the isloggedin
 */
 app.get("/user/isloggedin/:token", function(req, res) {
  // guet the request+
  var token = req.params.token;
  // check if it's a valid request
  if(token == undefined || token == null){
    handleError(res, "ERROR /user/isloggedin: Undefined or Null", "You are not logged in.", 404);
    res.end();
    return;
  }
  // if data is valid, check if the user is online
  mongoFind(res, UONLINE_COLLECTION, {"token" : token}, function(err, doc) {
    // if there is an error, throw an error to client
    if(err){
      if(err){
        handleError(res, "DB ERROR /user/isloggedin: ", "Unexpected error.");
        res.end();
      } 
    }
    // if there is no error compare tokens and send the user email
    else { 
      if(doc[0] === undefined){
        handleError(res, "ERROR /user/isloggedin: token not found", "You are not logged in.", 404);
        res.end();
        return;
      }
      console.log("SUCCESS /user/isloggedin")
      var email = doc[0]._id;

      res.status(200).json({"success" : true, "message": "You are logged in.", "data" : {"email" : email}});
      res.end();
    }
  });
 });

/*  "/user/account/delete"
 *    DELETE: delete all where user is in
 */
 app.delete("/user/account/delete/:token", function(req,res){
  var token = req.params.token;
  var email = "";
  // first we need to get the email
  mongoFind(res, UONLINE_COLLECTION, {"token" : token}, function(err,doc){
    if(err){
      handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
      res.end();
      return;
    } 
    // if there is no error get the email and check if it is valid
    email = doc[0]._id;
    if(email == null || email === undefined){
      handleError(res, "DB ERROR /user/account/delete/:token", "You are not logged in.");
      res.end();
      return;
    }
    // if the email is correct start removeing data
    mongoRemove(res, ALLITEMS_COLLECTION, {"owner" : email}, function(err, result){
      if(err){
        handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
        res.end();
        return;
      }
      console.log(result);
    });// mongoRemoveItems
    mongoRemove(res, UONLINE_COLLECTION, {"_id" : email}, function(err, result){
      if(err){
        handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
        res.end();
        return;
      }
      console.log(result);
    })// mongoRemoveUOnline
    mongoRemove(res, USERS_COLLECTION, {"_id" : email}, function(err, result){
      if(err){
        handleError(res, "DB ERROR /user/account/delete/:token", "Unexpected error.");
        res.end();
        return;
      }
      console.log(result);
    })// mongoRemoveUOnline
    // if all went ok 
    res.status(200).json({"success": true, "message": "Account successfully deleted."});
    res.end();
    return;

  });//mongoFind
 });

/*  "/user/account/password"
 *    POST: changes the password
 */
 app.post("/user/account/password", function(req,res){
    console.log("Into user/account/password");
    var email = req.body.email;
    var opw = req.body.oldpassword;
    var npw = req.body.newpassword;

    // make sure there are valid
    if(opw === undefined || npw === undefined || email === undefined || opw == null || npw==null || email==null){
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
                    res.status(200).json({"success" : true, "message" : "Password Successfully changed."});
                    res.end();
                  }
                }); //mongo update
              });// bcrypt 2
            }// psw match
          }// psw no error
        });// bcrypt 1
      }// user find no error
    });
 });

// ITEMS API ROUTES BELOW
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
      console.log(docs)
    }
  });
});

/*  "/items/:token"
 *    GET: finds items by token
 */
app.get("/items/:token", function(req, res){
  var token = req.params.token;
  // check if there is a token, if not throw error
  if(token === undefined || token == null){
    handleError(res, "ERROR /items/:token no token", "You are not logged in.");
    res.end();
    return;
  }
  // if the token exists get the email and search the items with this owner
  var token = {"token": token};
  mongoFind(res, UONLINE_COLLECTION, token, function(err, doc){
    if(err){
      handleError(res, err.massage, "Unexpected error.");
      res.end();
      return;
    } else {
      // the doc is empty?
      var email = doc[0]._id;
      if(email === undefined){
        handleError(res, "ERROR emailByToken, no data found uonline", "You are not logged in.", 404);
        res.end();
        return;
      } else {
        // find the items for this email
        mongoFind(res, ALLITEMS_COLLECTION, {"owner": email}, function(er, docs){
          if(er){
            handleError(res, er.massage, "Unexpected error.");
            res.end();
            return;
          } else {
            // the docs are empty?
            if(docs[0] == null || docs[0] === undefined){
              handleError(res, "ERROR emailByToken, no data found allitems", "You have no items. Add an Item and now start selling!", 404);
              res.end();
              return;
            } else {
              // send the data
              res.status(200).json({"success": true, "message": "Items found.", "data": docs});
              res.end();
            }// docs found
          }// else there is no error
        });// mongo find2
      }// else email
    }// else there is no error
  });// mongo find1
});
/*  "/items"
 *    POST: add an item
 */
app.post("/items", function(req, res) {
  var newItem = req.body;
  //Add the date to the item

  if (newItem === undefined || newItem == null) {
    handleError(res, "Invalid user input", "No data provided.", 400);
    res.end();
    return;
  }

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
});
/*  "/items/edit"
 *    POST: update an item
 */
app.post("/items/edit", function(req, res){
  var item = req.body;
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
  console.log(id)
  console.log(data)
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
/*  "/items/delete/:token"
 *    DELETE: delete the contact
 */
app.delete("/items/delete/:token/:item_id", function(req, res){
  var token = req.params.token;
  var item_id = req.params.item_id;
  console.log(item_id)
  console.log(token)
  if(token === undefined || item_id === undefined || token == {} || item_id == {}){
    handleError(res, "ERROR /items/delete/:token invalid data", "Unexpected error, please, restart the site and try again.");
    res.end();
    return;
  } else {
    // search email by token
    mongoFind(res, UONLINE_COLLECTION, {"token": token}, function(err, doc){
      if(err){
        // if error, thorw error
        handleError(res, err.message, "Unexpected error, please, restart the site and try again.");
        res.end();
        return
      } else {
        // if success, check if the doc is empty
        var email = doc[0]._id;
        if(email === undefined){
          handleError(res, "ERROR /items/delete/:token not logged in", "You are not logged in.");
          res.end();
          return;
        } else {
          // if it success:
          // to make sure that the token send is from the owner of the object:
          var id = new mongodb.ObjectID(item_id);
          var data = {"_id": id, "owner": email};
          data._id = id;
          console.log(data);
          mongoRemove(res, ALLITEMS_COLLECTION, data, function(error, result){
            if(error){
              handleError(res, error.message, "Unable to remove the item, please, restart the site and try again.");
              res.end();
              return;
            } else {
              console.log("SUCC");
              res.status(200).json({"success": true, "message": "Item successfully removed."});
              res.end();
            }
          })
        }
      }
    })
  }
});

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */
/*
app.get("/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

app.post("/contacts", function(req, res) {
  var newContact = req.body;
  newContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 

app.get("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);  
    }
  });
});

app.put("/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});
*/
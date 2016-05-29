var mongoose = require("mongoose");

var URI = "mongodb://heroku_p3lgr1x0:eg1phk01stdfh3crhi4v72vsdi@ds023932.mlab.com:23932/heroku_p3lgr1x0";

mongoose.connect(URI)
var db = mongoose.connection;
db.on('error', console.error.bind(console, "Connection to db error:"));
db.once('open', function(){
  var usersSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true,
      required: true
    },
    firstName: {
      type: String,
      required: true
    }, 
    lastName: {
      type: String,
      required: true
    },
    hash: String,
    salt: String
  });
  var users = mongoose.model("users", usersSchema)
  
});
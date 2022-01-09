const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const mongoose = require('mongoose');
const UserModel = require('./Models/User');

const bcrypt = require('bcrypt');


const uri = "mongodb://localhost:27017/session";
/* to connect mongoose */
mongoose
  .connect(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
 
  })
  .then(() => console.log('mongoDB connected...'));

  // creating the mongodb session store
  const  store = new MongoDBStore({
    uri: uri,
    collection: 'mySessions'
  });

  // Catch errors
store.on('error', function(error) {
    console.log(error);
  });


//app.set('trust proxy' , 1);  only do if secured network 
app.use((
    session({
    secret : 'keyboard cat',
    resave : false,
    saveUninitialized : false,
    store : store,


})));

/* is auth middleware  */
const isAuth = (req, res , next) => {
  if(req.session.isAuth) {
    next();
  }
  else{
    res.redirect('/login');
  }
}


// to allow ejs to send files 
app.set("view engine", "ejs");
// this is to use the body parser 
app.use(express.urlencoded({ extended: true }));




/*

Creating the routes 
*/

/* landing page  */
app.get("/",(req,res) =>
{
  res.render("LandingPage");
});

/* login page get route */

app.get("/login",(req,res) =>
{
  res.render("Login");
});
/* login app functionality */

app.post("/login",async (req,res) =>
{

  const {email , password}  = req.body;
  
  const user = await UserModel.findOne({email});
  
  if(!user){
     window.alert("your credentials are wrong either register if new or login again ");
     res.redirect('/login');
  }
     
  const passcheck = await bcrypt.compare(password,user.password);

     if(!passcheck){
        window.alert("you have entered wrong password");
        res.redirect('/login');

     }


    req.session.isAuth = true;

     res.redirect('/dashboard');

  }
  
);

/* register page route */

app.get("/register",(req,res) => {
  res.render("Register"); 
});

/*  register page route */

app.post("/register" , async (req, res) => {
    const {username , email , password}  = req.body;
    
    let user = await UserModel.findOne({email});

    if(user){
      windows.alert("User Already Exist ! Move to Login Page or Register with new details!");
      return res.redirect('/register');

    }
    // encrypt password
    const hashedpassword = await bcrypt.hash(password , 12);

    user = new UserModel({
      username,
      email,
      password : hashedpassword
    })
    
   await user.save();
   

    res.redirect("/login");
    


   
});

/* dashboard */

app.get("/dashboard",isAuth,(req,res) => {
  res.render("LoginSuccess");
})

/* logout route */
app.post('/logout',(req,res) => {
  req.session.destroy((err) => {
    if(err) throw err;
    res.redirect('/');

  })
})




const port = process.env.PORT || 8000;

app.listen(port , () => {
    console.log(`app running on ${port}`);
});

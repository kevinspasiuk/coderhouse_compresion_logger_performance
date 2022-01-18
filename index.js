const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { Strategy: FacebookStrategy } = require('passport-facebook');


const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true};


const app = express();

app.use(session({
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://admin:admin@clusterkevin.uq0gf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
      mongoOptions: advancedOptions    
    }),
    secret: 'shhhhhhhhhhhhhhhhhhhhh',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60000
    }
}));

const FACEBOOK_CLIENT_ID = '260685306032241';
const FACEBOOK_CLIENT_SECRET = '38560ef88d209f9aca142f7e213eab22';
const PORT = 8080

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/facebook/callback`,
    profileFields: [ 'id', 'displayName', 'photos', 'emails' ],
    scope: [ 'email' ]
}, (accessToken, refreshToken, userProfile, done) => {
    return done(null, userProfile);
}));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


const exphbs = require('express-handlebars');

app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'index.hbs'
}));

// app.set('view engine', 'handlebars')
app.use(express.static('public'));
app.set('views', './views');
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res){
  if (req.isAuthenticated()) {
    res.render('loggeado.hbs', {nombre: req.user.displayName, 
                                foto: req.user.photos[ 0 ].value,
                                email: req.user.emails[ 0 ].value})
  } else {
    res.render('formulario.hbs')
  }
});

/* Old form login*/
app.post('/login', (req, res) => {

    console.log("Login! ", req.body.email )
    const username = req.body.email
    const password = req.body.password

    req.session.username = username
    res.redirect("/")
})


app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/faillogin'
}));

app.get('/faillogin', (req, res) => {
  res.render('login-error', {});
})

app.post('/logout', (req, res) => {
  const nombre = req.session.username
  req.logout();
  req.session.destroy(err => {
        if (err) {
          res.json({ status: 'Logout ERROR', body: err })
        } else {
          res.render('logout.hbs',{layout :"logout.hbs", nombre: nombre})
        }
      })
})

app.listen(PORT, () => {
  console.log(`Servidor express escuchando en el puerto ${PORT}`)
})
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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


app.use(express.json());

const users = {};

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
  if (req.session.username) {
    res.render('loggeado.hbs', {nombre: req.session.username})
  } else {
    res.render('formulario.hbs')
  }
});

app.post('/login', (req, res) => {

    console.log("Login! ", req.body.email )
    const username = req.body.email
    const password = req.body.password

    req.session.username = username
    res.redirect("/")
})


app.post('/logout', (req, res) => {
  const nombre = req.session.username

  req.session.destroy(err => {
        if (err) {
          res.json({ status: 'Logout ERROR', body: err })
        } else {
          res.render('logout.hbs',{layout :"logout.hbs", nombre: nombre})
        }
      })
})

const PORT = 8080
app.listen(PORT, () => {
  console.log(`Servidor express escuchando en el puerto ${PORT}`)
})
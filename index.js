const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const parseArgs = require('minimist');
const compression = require('compression')
const logger = require('./utils/logger.js')


const { Strategy: FacebookStrategy } = require('passport-facebook');
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true};

const args = parseArgs(process.argv.slice(2), {alias: {p: 'PUERTO', m: "MODO"} });
const PORT = args.PUERTO || 8080
const MODO = args.MODO || 'fork'
const app = express();
app.use(compression());

const cluster = require('cluster')
const numCPUs = require('os').cpus().length

/* --------------------------------------------------------------------------- */
/* MASTER */
if (cluster.isMaster && MODO == 'cluster') {
  logger.info(numCPUs)
  logger.info(`PID MASTER ${process.pid}`)

  for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
  }

  cluster.on('exit', worker => {
      logger.info('Worker', worker.process.pid, 'died', new Date().toLocaleString())
      cluster.fork()
  })
}
else {

  /* --------------------------------------------------------------------------- */
  /* WORKERS */
  
  app.use(session({
      store: MongoStore.create({
        mongoUrl: 'mongodb+srv://admin:admin@clusterkevin.uq0gf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
        mongoOptions: advancedOptions    
      }),
      secret: `${process.env.SESSION_SECRET}`,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000
      }
  }));

  require('dotenv').config();
  const FACEBOOK_CLIENT_ID = process.env.FB_CLIENT_ID ;
  const FACEBOOK_CLIENT_SECRET = process.env.FB_CLIENT_SECRET;



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
  app.use(express.static('views'));
  app.set('views', './views');
  app.use(express.urlencoded({ extended: true }));


  /* Routes */

  app.all('/*', function (req, res, next) {
    logger.info(`Recibí ${req.method} a ${req.path}`);
    next();
  })

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

  app.get('/info', (req, res) => {
    
    res.send({info: {
      argumentos: process.argv,
      os: process.platform,
      node_ver: process.version,
      uso_memoria: process.memoryUsage(), 
      path_ejecucion: process.cwd(),
      process_id: process.pid,
      project_folder: process.title,
      numcpu: numCPUs
    }});
  })

  const randomRouter = require('./routes/random');
  app.use('/api/randoms',randomRouter)


  app.use((req, res, next) => {
    res.status(404);
    logger.warn(`Not Found: ${req.method} a ${req.path}`);
    next();
  })

  const server = app.listen(PORT, () => {
    logger.info(`[PID: ${process.pid}] Servidor express escuchando en el puerto ${PORT}`)
  })

  server.on('error', error => logger.error(`Error en servidor: ${error}`))
}
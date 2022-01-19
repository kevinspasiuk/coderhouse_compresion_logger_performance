var express = require('express');
var router = express.Router();
const { fork } = require('child_process')
const DEFAULT_NUMBER =100_000_000 


router.get('/', function(req, res, next) {
  console.log("nueva peticion")
  const cant = parseInt(req.query.cant)
  const amount = isNaN(cant) ? DEFAULT_NUMBER:  cant 

  const computo = fork('./utils/random_numbers.js')
  computo.send(amount)
  computo.on('message', numbers => {
    res.send({ocurrencias: numbers });
  })
});

module.exports = router;

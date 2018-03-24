const router = require('express').Router();
const bitcore = require('bitcore-lib');

const db = require('../db');
const client = require('../lib/bitcoin-client');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
//=============================================================================================================
router.post('/', function(req, res, next) {
  const privateKeyString = req.body.pk;
  if(/\b[A-Fa-f0-9]{64}\b/.test(privateKeyString)) {
    console.log("VALID");
    console.log('db', db);
    db.set('addrFromPrKey', bitcore.PrivateKey(privateKeyString).toAddress());
    console.log('after set key');
    WIFkey = bitcore.PrivateKey(privateKeyString).toWIF();

    (new Promise((resolve, reject) => {
      client.importPrivKey(WIFkey, (err, res) => {
        err ? reject(err) : resolve(res);
      })
    }))
    .then(res => {
      console.log('before listUnspent');
      return new Promise((resolve, reject) => {
        client.listUnspent(1, 9999999, [db.get('addrFromPrKey').toString()], function(err, res){
          err ? reject(err) : resolve(res);
        });
      });
    })
    .then(res => {
      const balance = res.reduce((acc, current) => {
        acc += current.amount;
        return acc;
      }, 0);

      console.log('calculating balance', balance);
      db.set('balance', balance);
    })
    .then(() => {
      res.status(200).send('All ok');
    })
    .catch(err => {
      console.error(err)
    });
    // client.importPrivKey(WIFkey, function(err,res){
    //   console.log("IMPORT KEY");
    //   console.log(err);
    //   console.log(res);
    //   client.listUnspent(1, 9999999, [addrFromPrKey.toString()], function(err, res){
    //     console.log(err);
    //     console.log(res);
    //     for(var i=0; i<res.length; i++){
    //       bal+=res[i].amount;
    //     }
    //     console.log(bal);
    //   });
    // });
    // res.status(200).send("All Ok");
  }
  else {
    res.status(400).send("Private Key is not valid");
  }
});

module.exports = router;

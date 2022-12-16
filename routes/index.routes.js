const express = require('express');
const router = express.Router();

/* GET home page */
router.get("/", (req, res, next) => {

  if (req.session.currentUser){
    let userInfo = req.session.currentUser
    res.render("index", {userInfo});  
  } else if(!req.session.currentUser){
    res.render("index"); 
  }

});

module.exports = router;

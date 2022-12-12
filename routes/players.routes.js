


const express = require('express');
const router = express.Router();
const axios = require('axios')
const Prediction = require('../models/Prediction.model')
const User = require('../models/User.model');
const Player = require('../models/Player.model');


let API_KEY =""
let createUserConfig = {
    method: 'post',
    url: 'http://api.cup2022.ir/api/v1/user',
    headers: 
        "Content-Type: application/json"
        ,
    data: { //replace Date here by your personal information
        "name" : `${process.env.API_NAME}`,
        "email": `${process.env.API_EMAIL}`,
        "password": `${process.env.API_PASS}`,
        "passwordConfirm" : `${process.env.API_PASS}`
    }
};

//To Log In with Email and Password on the API => response will give back a Token to access all the APIs services, this token is autogenerated every time you login
let loginUserConfig = {
    method: 'post',
    url: 'http://api.cup2022.ir/api/v1/user/login',
    headers: "Content-Type: application/json",
    data: { //replace Date here by your personal information
        "email": `${process.env.API_EMAIL}`,
        "password": `${process.env.API_PASS}`
    }
};

//To send a GET request to API using the token from login
let tokenAcessGETConfig = {
    method:'get',
    headers: `Authorization : Bearer ${API_KEY}`
}

const isLoggedIn = require("../middleware/isLoggedIn")
const isLoggedOut = require("../middleware/isLoggedOut");


// GET /user-dashboard-All-Players
router.get('/profile/:username/players',isLoggedIn ,  async (req,res)=>{
    let userInfo = req.session.currentUser
    
        Player.find()
        .then( allPlayersFromDb =>{
        res.render('players', {allPlayersFromDb, userInfo} )    
        })
    .catch(err=>{
        res.render('error')
    })
})

// POST/Players to user dashboard
router.post('/profile/:id/players/add',isLoggedIn , (req,res)=>{
    const playerId = req.params.id
    const userId = req.session.currentUser._id

    Player.findById(playerId)
        .then (playerData=>{
            console.log(playerData)
            User.findById(userId)
                .populate("players")
                .then (userInfo=>{
                    console.log(userInfo)
                        /*this checks if player's name is already existant in the user.players Array*/
                    if (userInfo.players.find(player => player.playername === playerData.playername) ) {
                        console.log("player already exists in your team")
                        Player.find()
                            .then(allPlayersFromDb=>{

                                res.render(`players`, {allPlayersFromDb, userInfo, errorMessage: "This player already exists in your team, try picking another one" })
                            })
                        
                      }
                        /*this checks if player's team is already full*/
                      else if (userInfo.players.length > 15){
                        console.log("Team capacity reached! You already have 15 players")
                        Player.find()
                            .then(allPlayersFromDb=>{
                                res.render(`players`, {allPlayersFromDb, userInfo, errorMessage: "Your Team already has 15 players, please delete some before adding any other" })
                            })
                      }
                      else {
                    userInfo.players.push(playerData)
                    userInfo.save()
                    res.redirect(`/profile/${userId}`)
                }
                })
                 
            })
            .catch(err=>{
                res.render('error', {errorMessage: err})
            })
    
})

// DELETE/Player in the dashboard
router.post('/profile/:playersId/delete', (req,res)=>{
    console.log("working?")
    let {playersId} = req.params;
    let userData = req.session.currentUser
    Player.findById(playersId)
        .then(playersInformation=>{
            console.log("players info" + playersInformation)
            User.findById(userData._id)
        .populate("players")
        .then(userInformation=>{
            console.log(userInformation)
            for (i=0;i<userInformation.players.length;i++){
                console.log("looping")
                if (userInformation.players[i].playername === playersInformation.playername){
                    userInformation.players.splice(i,1)
                    console.log("new array is:  " + userInformation)
                } else {
                    continue
                }
            }
            userInformation.save()
            res.redirect(`/profile/${userInformation.username}/`)
        })
        .catch(err=>{
            res.render('error', {errorMessage: err})
        })
        })
})


router.post('/profile/:username/players/verify', async (req,res)=>{
    let userInfo = req.session.currentUser

    await axios(loginUserConfig)
        .then (data=>{
            API_KEY = data.data.data.token
            return API_KEY 
    })
    
        
        await axios("http://api.cup2022.ir/api/v1/match",  {
            method:'get',
            headers: `Authorization : Bearer ${API_KEY}`
        })
            .then(matchesData=> {
                matchesArray = matchesData.data.data
                return matchesArray
            })

        User.findById(userInfo._id)
            .populate('players')
            .then (userInfoPupulated=>{
                console.log(userInfoPupulated)
                for (i=0;i<userInfoPupulated.players.length;i++){
                    let country = userInfoPupulated.players[i].team
                    console.log(country)
                    let countryUppercase = country.charAt(0).toUpperCase() + country.slice(1);
                    let filteredAwayMatchesArray = matchesArray.filter(match => match.away_team_en === countryUppercase)

                    for (y=0;y<filteredAwayMatchesArray.length;y++){
                        if (filteredAwayMatchesArray[y].home_score < filteredAwayMatchesArray[y].away_score){
                            userInfoPupulated.fantasyPoints += 5
                        } 
                    }

                    let filteredHomeMatchesArray = matchesArray.filter(match => match.home_team_en === countryUppercase)
                    console.log(filteredHomeMatchesArray)
                    for (y=0;y<filteredHomeMatchesArray.length;y++){
                        if (filteredHomeMatchesArray[y].home_score > filteredHomeMatchesArray[y].away_score){
                            userInfoPupulated.fantasyPoints += 5   
                        } 
                    }
                    
                }
                userInfoPupulated.save()
                res.redirect(`/profile/${userInfo.username}`)
            })
})



module.exports = router;
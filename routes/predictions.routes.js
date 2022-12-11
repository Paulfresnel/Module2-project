const express = require('express');
const router = express.Router();
const axios = require('axios')
const Prediction = require('../models/Prediction.model')

let API_KEY =""

const isLoggedIn = require("../middleware/isLoggedIn")
const isLoggedOut = require("../middleware/isLoggedOut");
const User = require('../models/User.model');


//Axios Call to create a User to be able to use the API services
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


router.post('/predictions/:id',isLoggedIn, (req,res)=>{
   let predictionId = req.params.id;
   let userId = req.session.currentUser._id
   const { awayScore, homeScore } = req.body
    Prediction.findByIdAndUpdate(predictionId, {awayScore, homeScore}, {new: true})
    .then (predictionInfo=>{
        res.redirect(`/profile/${userId}/predictions`)
    })
})

router.post('/predictions/:id/delete',isLoggedIn, (req,res)=>{
    let predictionId = req.params.id;
    let userId = req.session.currentUser._id
    
    Prediction.findByIdAndDelete(predictionId)
            .then(data=>{
        User.findById(userId)
        .then(userInfo=>{
                    userInfo.predictionsCount -= 1;
                    userInfo.save()
                    res.redirect(`/profile/${userId}/predictions`)
                })
            })
            
})

let matchesArray = []
router.post('/predictions/:id/verify', isLoggedIn, async (req,res)=>{
    let predictionId = req.params.id
    let predictionMatchId
    let predictionInformation
    const userId = req.session.currentUser._id
    let userData = req.session.currentUser

    Prediction.findById(predictionId)
        .then(predictionInfo=>{
            predictionInformation = predictionInfo
            predictionMatchId = predictionInfo.matchId
            return predictionMatchId, predictionInformation
        })
    

    await axios(loginUserConfig)
    .then (data=>{
        API_KEY = data.data.data.token
        return API_KEY 
})
    await axios(`http://api.cup2022.ir/api/v1/match/${predictionMatchId}`,  {
        method:'get',
        headers: `Authorization : Bearer ${API_KEY}`
    })

    .then(async (matchData) =>{
        let matchInfo = matchData.data.data
        let parsedMatchDate = Date.parse(matchInfo[0].local_date)
        let todayDate = new Date()
        let parsedTodayDate = Date.parse(todayDate)

        if(matchInfo[0].finished === "TRUE" || parsedMatchDate < parsedTodayDate){
        User.findById(userId)
            .then (async (userDBData)=>{
                if (matchInfo[0].home_score > matchInfo[0].away_score){
                    let winnerScore = matchInfo[0].home_score
                    let loserScore = matchInfo[0].away_score

                    
                    if(predictionInformation.homeScore > predictionInformation.awayScore){
                        let condition1=true
                        if(predictionInformation.homeScore === winnerScore && predictionInformation.awayScore === loserScore){
                            let condition2 = true;
                            let pointsToAdd = 155;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 2;
                            userDBData.predictionMessage = "You have correctly predicted the winner, and the scores! You're a Natural! You earn +155 Points"
                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        } else {
                            let condition2 = false;
                            let pointsToAdd = 55;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 1;
                            userDBData.wrongPredictions += 1;
                            userDBData.predictionMessage = "You have correctly predicted the winner, but not the scores! You earn +55 Points"

                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        }
                    } else {
                        let condition1 = false
                        let condition2 = false
                        let pointsToAdd = 5;
                        userDBData.predictionsPoints += pointsToAdd
                        userDBData.wrongPredictions += 2;
                        userDBData.predictionMessage = "You have lost your prediction, but you're still awarded 5 points for your participation"
                        userDBData.save()
                        Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                    }
                } 
                else if (matchInfo[0].home_score < matchInfo[0].away_score){
                    let winnerScore = matchInfo[0].away_score
                    let loserScore = matchInfo[0].home_score

                    
                    if(predictionInformation.homeScore < predictionInformation.awayScore){
                        let condition1=true
                        if(predictionInformation.awayScore === winnerScore && predictionInformation.homeScore === loserScore){
                            let condition2 = true;
                            let pointsToAdd = 155;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 2;
                            userDBData.predictionMessage = "You have correctly predicted the winner, and the scores! You're a Natural! You earn +155 Points"
                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        } else {
                            let condition2 = false;
                            let pointsToAdd = 55;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 1;
                            userDBData.wrongPredictions += 1;
                            userDBData.predictionMessage = "You have correctly predicted the winner, but not the scores! You earn +55 Points"
                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        }
                    } else {
                        let condition1 = false
                        let condition2 = false
                        let pointsToAdd = 5;
                        userDBData.predictionsPoints += pointsToAdd
                        userDBData.wrongPredictions += 2;
                        userDBData.predictionMessage = "You have lost your prediction, but you're still awarded 5 points for your participation"
                        userDBData.save()
                        Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                    }
        
        
                }
                else if (matchInfo[0].home_score === matchInfo[0].away_score){
                    let winnerScore = matchInfo[0].home_score
                    let loserScore = winnerScore
                    if(predictionInformation.homeScore === predictionInformation.awayScore){
                        let condition1 = true;
                        if (predictionInformation.homeScore === winnerScore){
                            let condition2 = true;
                            let pointsToAdd = 155;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 2;
                            userDBData.predictionMessage = "You have correctly predicted the winner, and the scores! You're a Natural! You earn +155 Points"
                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        } else {
                            let condition2 = false;
                            let pointsToAdd = 55;
                            userDBData.predictionsPoints += pointsToAdd
                            userDBData.correctPredictions += 1;
                            userDBData.wrongPredictions += 1;
                            userDBData.predictionMessage = "You have correctly predicted the winner, but not the scores! You earn +55 Points"
                            userDBData.save()
                            Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                        }
                    } else{
                        let condition1 = false
                        let condition2 = false
                        let pointsToAdd = 5;
                        userDBData.predictionsPoints += pointsToAdd
                        userDBData.wrongPredictions += 2;
                        userDBData.predictionMessage = "You have lost your prediction, but you're still awarded 5 points for your participation"
                        userDBData.save()
                        Prediction.findByIdAndDelete(predictionId)
                                .then(predictionErased=>{
                                    console.log(predictionErased)
                                })
                    }
                }

            User.findById(userId)
                        .populate('players')
                        .then(userInfo=>{
                            userData = userInfo
                            res.redirect(`/profile/${userData._id}/predictions`) 
                        })
            })
        

        } else {
            await axios(loginUserConfig)
            .then (data=>{
        API_KEY = data.data.data.token
        return API_KEY 
})

    if(matchesArray.length<=0){
    await axios("http://api.cup2022.ir/api/v1/match",  {
        method:'get',
        headers: `Authorization : Bearer ${API_KEY}`
    })
        .then(matchesData=> {
            matchesArray = matchesData.data.data
            return matchesArray
        })
    }


    User.findById(userId)
        .populate('predictions')
        .then(userData=>{        
            for (i=0;i<userData.predictions.length;i++){
                let data = userData.predictions[i].matchId
                let mappedMatch = matchesArray.filter(matchToFilter=>matchToFilter.id === `${data}`)
                    userData.predictions[i].homeFlag = mappedMatch[0].home_flag
                    userData.predictions[i].awayFlag= mappedMatch[0].away_flag
                    userData.predictions[i].awayTeam= mappedMatch[0].away_team_en
                    userData.predictions[i].homeTeam= mappedMatch[0].home_team_en
/*                     userData.save()
 */            }
            res.render("profile/predictions", {userData, errorMessage:"You can't verify an unfinished match! Wait until the game is over!"}) 
        })
        }
           
    }) 
    console.log("verified")
})


router.get('/profile/:id/dashboard/predictions', isLoggedIn, async (req,res)=>{
    
        await axios(loginUserConfig)
        .then (data=>{
            API_KEY = data.data.data.token
            return API_KEY 
    })
    
        if(matchesArray.length<=0){
        await axios("http://api.cup2022.ir/api/v1/match",  {
            method:'get',
            headers: `Authorization : Bearer ${API_KEY}`
        })
            .then(matchesData=> {
                matchesArray = matchesData.data.data
                return matchesArray
            })
        }
    let userData = req.session.currentUser
    User.findById(userData._id)
    .populate('predictions')
    .then(userInfo=>{
        if (userInfo.predictionsCount !== 0){
        let rate = ((userInfo.correctPredictions/userInfo.predictionsCount)*100).toFixed(2)
        userInfo.predictionsRate = rate
    } else if (userInfo.predictionsCount === 0){
        let rate = 0
        userInfo.predictionsRate = rate
    }
        let latestPredictions = userInfo.predictions.reverse()
        if (userInfo.predictions.length === 0){
            userData = userInfo
            res.render('profile/prediction-dashboard', {userData})  
        }
        else if (userInfo.predictions.length !== 0){
        for (let i=0;i<5 || i<=userInfo.predictions.length;i++){
            if (i<userInfo.predictions.length){
            let date = latestPredictions[i].updatedAt
            let splicedDate = date.toDateString()
            let splicedTime = date.toTimeString()
            let splicedTimeReadable = splicedTime.slice(0,8)

            let data = latestPredictions[i].matchId
            let mappedMatch = matchesArray.filter(matchToFilter=>matchToFilter.id === `${data}`)

                latestPredictions[i].homeFlag = mappedMatch[0].home_flag
                latestPredictions[i].awayFlag= mappedMatch[0].away_flag
                latestPredictions[i].awayTeam= mappedMatch[0].away_team_en
                latestPredictions[i].homeTeam= mappedMatch[0].home_team_en
                latestPredictions[i].date= splicedDate
                latestPredictions[i].time= splicedTimeReadable
            }
                if (i===latestPredictions.length){
                    userData = userInfo
                    res.render('profile/prediction-dashboard', {userData, latestPredictions})
                    break
                }
        }
    
    }
    })
    
})


router.get('/profile/:username/predictions-leaderboard',isLoggedIn, (req, res)=>{
    let userInfo = req.session.currentUser
    User.find()
        .then(userArray=>{
            let userData = userArray.sort((a,b)=>{
                return b.predictionsPoints - a.predictionsPoints;
            })
            for (i=0;i<userData.length;i++){
                let rate = ((userData[i].correctPredictions/userData[i].predictionsCount)*100).toFixed(2)
                userData[i].predictionsRate = rate
            }
            res.render('profile/predictions-leaderboard', {userData, userInfo})
        })
})


module.exports = router;


















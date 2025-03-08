import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import bcrypt from "bcryptjs"
import "dotenv/config"
import jwt from "jsonwebtoken"
//import {MongoClient} from "mongodb"

//import userRoutes from "./routes/users.js"
import User from "./models/userSchema.js"
import Question from "./models/questionsSchema.js"

const app = express()

const PORT = 5001
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(express.json({limit: "30mb", extended: true}))
// app.use(express.urlencoded({limit: "30mb", extended: true}))
app.use(cors())

app.get('/', (req, res)=> {
    res.send('This is a stackoverflow clone')
})

app.post('/signin', async (req, res)=> {
    try {
        const {username, email, password} = req.body
        const tempdata = await User.find({username: username})
        //console.log(tempdata)
        if(tempdata.length > 0) {
            //console.log("empty")
            res.status(409).send({error: "Username already exists, choose a different username!"})
        } else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const newUser = new User({username, email, password: (String)(hashedPassword)})
            await newUser.save()
            res.send('post successful')
        }
    } catch(err) {
        console.log(err)
        res.send({error: "post not successful"})
    }
})

// app.get("/signin", async (req, res) => {
//     try {
//         const udata = await User.find()
//         res.json(udata)
//     } catch(err) {
//         res.send({error: "unable to fetch"})
//     }
// })

app.post('/login', async (req, res)=> {
    try {
        const {username, password} = req.body
        const data = await User.findOne({username})
        if(!data) {
            res.status(401).send({message: "Invalid username"})
        }
        if(!password) {
            res.status(500).send({message: "Server Error Please Refresh!"})
        }
        const isPasswordTrue = await bcrypt.compare(password, data.password)
        if(isPasswordTrue) {
            const token = jwt.sign({userId: data._id}, process.env.SECRET_KEY, {expiresIn: "2d"})
            const refreshToken = jwt.sign({userId: data._id}, process.env.REFRESH_TOKEN_KEY, {expiresIn: "30d"})
            const r = data.reputation
            res.json({token, refreshToken, r})
        } else {
            res.status(401).send({message: "Wrong password"})
        }
    } catch(err) {
        console.log(err)
        res.send({error: "post not successful"})
    }
})

async function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    console.log(token)
    if (!token) {
      return res.status(401).send({ error: 'No token provided' });
    }
  
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded)
        req.user = decoded;
        next();
    } catch (err) {
        if(err.name === "TokenExpiredError") {
            console.log('Token has expired');
            return res.status(401).json({error: "token expired!"})
        } else {
            console.log(err)
            return res.status(401).send({ error: 'Invalid token' });
        }
    }
}

app.get("/refreshtoken", (req, res) => {
    const refresh_token = req.headers.authorization.split(' ')[3]
    const refresh_decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY)
    const newAccessToken = jwt.sign({userId: refresh_decoded.userId}, process.env.SECRET_KEY, {expiresIn: "2d"})
    const newRefreshToken = jwt.sign({userId: refresh_decoded.userId}, process.env.REFRESH_TOKEN_KEY, {expiresIn: "30d"})
    console.log("new token ready")
    res.json({newAccessToken, newRefreshToken})
})

app.get("/getuserdata", verifyToken, async (req, res) => {
    try {
        const {username} = req.query
        const userdata = await User.find({username}).select('username tags joinedOn')
        res.send(userdata[0])      
    } catch(err) {
        console.log(err)
        res.send({error: "Unable to fetch user data!"})
    }
})

app.get("/getuserprofile", async (req, res) => {
    try {
        const {uname} = req.query
        console.log(uname)
        const userdata = await User.find({username: uname}).select('username tags joinedOn')
        res.send(userdata[0])      
    } catch(err) {
        console.log(err)
        res.send({error: "Unable to fetch user data!"})
    }
})

async function getCookie(req, res, next) { // sends userid for post requests
    try {
        console.log(req.body)
        const username = req.body.username
        const data = await User.findOne({username})
        console.log(data._id)
        req.body.id = data._id
        next()
    } catch(err) {
        console.log(err)
        return res.send("Some error occured!")
    }
}

app.post("/postquestion", getCookie, async (req, res) => {
    try {
        //console.log(req)
        const {title, desc, tags, username} = req.body
        const newQuestion = new Question({
            Title: title,
            questionDescription: desc,
            tags: tags,
            userid: req.body.id,
            askedBy: username
        })
        await newQuestion.save()
        res.send('post successful')
    } catch(err) {
        console.log(err)
        res.send({error: "post not successful"})
    }
})

async function getUserID(req, res, next) { // sends userid for get requests
    try {
        //console.log(req.query)
        const username = req.query.username
        const data = await User.findOne({username})
        //console.log(data._id)
        req.query.id = data._id
        next()
    } catch(err) {
        console.log(err)
        return res.send("Some error occured!!!")
    }
}

app.get("/myquestions", getUserID, async (req, res) => {
    try {
        //console.log(req.query)
        const results = await Question.find({userid: req.query.id})
        //console.log(results)
        res.send(results)
    } catch(err) {
        console.log(err)
        res.send({error: "Some error occurred!"})
    }
})

app.get("/api/getallquestions", async(req, res) => {
    try {
        const results = await Question.find().limit(20)
        res.send(results)
    } catch (error) {
        console.log(error)
        res.send({error: "Some error occured!"})
    }
})

app.get("/getquestiondata", async(req, res) => {
    try {
        //console.log(req.query)
        const results = await Question.find({_id: req.query.questionid})
        res.send(results[0])
    } catch(err) {
        console.log(err)
        res.send({error: `unable to fetch question data`})
    }
})

app.post("/postcomment", getCookie, async(req, res) => {
    try {
        const {comment, id, username, questionID} = req.body
        const obj = {
            comment: comment,
            userid: id,
            commentedBy: username,
        }
        const result = await Question.updateOne(
            {_id: questionID},
            { $push: { comments: obj } }
        )
        res.send("comment posted successfully!")
    } catch(err) {
        console.log(err)
        res.send({error: "unable to post comment"})
    }
})

app.post("/api/postanswer", getCookie, async(req, res) => {
    try {
        const {ansbody, id, username, questionId} = req.body
        const obj = {
            userid: id,
            answerUser: username,
            answerBody: ansbody
        }
        const userAnswer = Question.find({
            answeredby: {
                $elemMatch: {
                    userid: id
                }
            }
        })
        if(userAnswer) {
            res.status(409).send("You have already answered the question")
        } else {
            const result = await Question.updateOne(
                {_id: questionId},
                { $push: {answeredby: obj}}
            )
            res.send({message: "answer posted successfully!"})
        }
    } catch(err) {
        console.log(err)
        res.send({error: "unable to post answer"})
    }
})

app.post("/api/upvote", getCookie, async(req, res) => {
    try {
        let proceedtoVote = 0
        const {qid, ansid, id} = req.body
        if(ansid.length > 0) {
            const result = await User.findOne({
                _id: id,
                'upvotes.answerid': ansid
            })
            //console.log(result)
            if(result) {
                res.status(409).send({message:"you have already upvoted the answer"})
            } else {
                proceedtoVote = 2
            }
        } else {
            const result = await User.findOne({
                _id: id,
                'upvotes.questionid': qid,
                'upvotes.answerid': ""
            })
            //console.log(result)
            if(result) {
                res.status(409).send({message:"you have already upvoted the question"})
            } else {
                proceedtoVote = 1
            }
        }
        if(proceedtoVote === 1) {
            const obj = {
                questionid: qid,
                answerid: ansid
            }
            await User.updateOne(
                {_id: id},
                {$push: {
                    upvotes: obj
                }}
            )
            await User.updateOne(
                {_id: id},
                { $inc: {reputation: 10}}
            )
            await Question.updateOne(
                {_id: qid},
                {$inc: {upvotes: 1}} // we forgot to update the answer's upvote!!!
            )
            res.send({message: "question successfully upvoted."})
        } else if(proceedtoVote === 2) {
            const obj = {
                questionid: qid,
                answerid: ansid
            }
            await User.updateOne(
                {_id: id},
                {$push: {
                    upvotes: obj
                }}
            )
            await User.updateOne(
                {_id: id},
                { $inc: {reputation: 15}}
            )
            // const res = await Question.find({
            //     answeredby: { _id: new mongoose.Types.ObjectId(ansid) }
            // })
            // console.log(res)
            await Question.updateOne(
                { 'answeredby._id': ansid },
                { $inc: { 'answeredby.$.upvotes': 1 } }
            )    

            res.send({message: "answer successfully upvoted."})
        }

    } catch(err) {
        console.log(err)
        res.send({error: "unable to upvote answer"})
    }
})

app.post("/api/downvote", getCookie, async(req, res) => {
    try {
        let proceedToDownVote = 0
        const {qid, ansid, id} = req.body
        if(ansid.length > 0) {
            const result = await User.findOne({
                _id: id,
                'downvotes.answerid': ansid
            })
            //console.log(result)
            if(result) {
                res.status(409).send({message:"you have already downvoted the answer"})
            } else {
                proceedToDownVote = 2
            }
        } else {
            const result = await User.findOne({
                _id: id,
                'downvotes.questionid': qid
            })
            //console.log(result)
            if(result) {
                res.status(409).send({message:"you have already downvoted the question"})
            } else {
                proceedToDownVote = 1
            }
        }
        if(proceedToDownVote === 1) {
            const obj = {
                questionid: qid,
                answerid: ansid
            }
            await User.updateOne(
                {_id: id},
                {$push: {
                    downvotes: obj
                }}
            )
            await Question.updateOne(
                {_id: qid},
                {$inc: {downvotes: -1}} 
            )
            res.send({message: "question successfully downvoted."})
        } else if(proceedToDownVote === 2) {
            const obj = {
                questionid: qid,
                answerid: ansid
            }
            await User.updateOne(
                {_id: id},
                {$push: {
                    downvotes: obj
                }}
            )
            
            await Question.updateOne(
                { 'answeredby._id': ansid },
                { $inc: { 'answeredby.$.downvotes': -1 } }
            )    

            res.send({message: "answer successfully downvoted."})
        }

    } catch(err) {
        console.log(err)
        res.send({error: "unable to upvote answer"})
    }
})

app.get("/api/search", async(req, res) => {
    try {
        const sq = req.query.searchquery
        if(sq) {
            if(sq[0] === "[" && sq[sq.length - 1] === "]" && sq.length >= 3) {
                console.log(sq)
                const data = await Question.find({tags: sq.slice(1, sq.length - 1)})
                res.send(data)
            } else if(sq[0] === ":" && sq.length >= 2) {
                console.log(sq.slice(1))
                const data = await Question.find({Title: { $regex: sq.slice(1), $options: 'i'}})
                res.send(data)
            } else {
                res.send({message: "query format incorrect."})
            }
            
            //console.log(sq[sq.length - 1])
        } else {
            res.send({message: "query format incorrect."})
        }
    } catch (error) {
        console.error(error)
        res.send({error: "unable to parse your search query!"})
    }
})

//app.use('/user', userRoutes)

//const connection_url = process.env.CONN_URL
const conn_str = "mongodb://localhost:27017/mydb"

mongoose.connect(process.env.CONN_URL2, {
    useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => app.listen(PORT, ()=> {console.log(`server running on port ${PORT}`)}))
    .catch((err)=> console.log(err.message))
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    about: {type: String},
    tags: {type: [String]},
    joinedOn: {type: Date, default: Date.now},
    reputation: {type: Number, default: 0},
    privilege: {type: String, default: "user"},
    upvotes: [
        {
            questionid: String,
            answerid: {type: String, default: ""}
        }
    ],
    downvotes: [
        {
            questionid: String,
            answerid: {type: String, default: ""}
        }
    ]
})

const User = mongoose.model('User', userSchema)

export default User
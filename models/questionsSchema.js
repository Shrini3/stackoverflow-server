import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionId: {type: Number},
    Title: {type: String, required: true},
    questionDescription: {type: String, required: true},
    upvotes: {type: Number, default: 0},
    downvotes: {type: Number, default: 0},
    rating: {type: Number, default: 0},
    tags: [String],
    userid: {type: String, required: true},
    askedBy: {type: String},
    askedOn: {type: Date, default: Date.now},
    editedUserId: String,
    editedBy: {type: String},
    editedOn: {type: Date},
    comments: [
        {
            comment: String,
            userid: String,
            commentedBy: String,
            commentedOn: {type: Date, default: Date.now}
        }
    ],
    answers: {type: Number},
    answeredby: [
        {
            userid: String,
            answerUser: String,
            answerBody: String,
            answeredOn: {type: Date, default: Date.now},
            upvotes: {type: Number, default: 0},
            downvotes: {type: Number, default: 0},
            answereditedBy: String,
            answerEditerUserId: String,
            editedOn: {type: Date},
            comments: [
                {
                    comment: String,
                    userid: String,
                    commentedBy: String,
                    commentedOn: {type: Date, default: Date.now}
                }
            ]
        }
    ]
})

const Question = mongoose.model('Question', questionSchema)

export default Question
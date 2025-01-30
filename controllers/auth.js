import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import usersschema from "../models/userSchema.js"

export const login = async(req,res) => {
    const { email, password} = req.body
    try {
        const existinguser = await usersschema.findOne({email})
        if(!existinguser) {
            return res.status(404).json({message: "User don't exist."})
        }
        const isPasswordCrct = await bcrypt.compare(password, existinguser.password)
        if(!isPasswordCrct) {
            return res.status(404).json({message: "Invalid password."})
        }
        const token = jwt.sign({email: existinguser.email, id: existinguser._id},'test', {expiresIn: '1h'})
        res.status(200).json({result: existinguser, token})
    } catch(error) {
        res.status(500).json("Something went wrong...")
    }
}

export const signup = async(req,res) => {
    console.log(req.body)
    const {username, email, password} = req.body
    try {
        const existinguser = await usersschema.findOne({email})
        if(existinguser) {
            return res.status(404).json({message: "user already Exist."})
        }
        const hashedpassword = await bcrypt.hash(password, 12)
        const newUser = await usersschema.create({username, email, password: hashedpassword})
        const token = jwt.sign({ email: newUser.email, id: newUser._id}, "test", {expiresIn: "1h"})
        res.status(200).json({result: newUser, token})
    } catch(error) {
        res.status(500).json("Something went wrong...")
    }
}
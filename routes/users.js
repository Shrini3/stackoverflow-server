import express from "express"
import {login, signup} from "../controllers/auth.js"
//const app = express()
const router = express.Router()

router.post('/auth', signup) 

router.post('/authlogin', login)

export default router
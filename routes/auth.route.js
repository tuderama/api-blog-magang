import {Router} from "express";
import {refreshToken, signIn, signOut, signUp} from "../controller/auth.controller.js";
import {authorize} from "../middleware/auth.middleware.js";

export const authRouter = Router()

authRouter.post('/sign-in', signIn)
// authRouter.post('/sign-up', signUp)
authRouter.post('/sign-out', authorize, signOut)
authRouter.post('/refresh', refreshToken)
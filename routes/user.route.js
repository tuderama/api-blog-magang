import {Router} from "express";
import {deleteUser, getUserDetails, getUsers, updateUser} from "../controller/user.controller.js";
import {authorize} from "../middleware/auth.middleware.js";

export const userRouter = Router()

userRouter.get('/', authorize, getUsers)
userRouter.get('/:id', authorize, getUserDetails);
userRouter.put('/:id', authorize, updateUser)
userRouter.delete('/:id', authorize, deleteUser)
import {Router} from "express";
import {createPost, deletePost, getPost, getPosts, updatePost} from "../controller/post.controller.js";
import {authorize} from "../middleware/auth.middleware.js";
import {imageUpload} from "../middleware/imageStorage.middleware.js";

export const postRouter = Router()
postRouter.get("/", authorize, getPosts)
postRouter.get("/:id", authorize, getPost)
postRouter.post("/", authorize, imageUpload, createPost)
postRouter.put("/:id", authorize, imageUpload, updatePost)
postRouter.delete("/:id", authorize, deletePost)

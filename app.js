import express from 'express';
import {userRouter} from "./routes/user.route.js";
import {authRouter} from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import {postRouter} from "./routes/post.route.js";
import {errorHandler} from "./middleware/errorHandler.middleware.js";
import "express-async-errors";
import cors from "cors"

const app = express()

app.use(cors({
    origin: "*",
}));
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: false}))
app.use("/public/uploads", express.static("public/uploads"))

app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/posts', postRouter);

app.use(errorHandler)

app.listen(3000, () => {
    console.log("App running on http://localhost:3000")
})

export default app;



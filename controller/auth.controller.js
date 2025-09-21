import {PrismaClient} from "@prisma/client";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {ErrorResponse} from "../utils/errorResponse.js";

const prisma = new PrismaClient();

export const signIn = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if (!email || email.trim() === "") throw new ErrorResponse("Email tidak boleh kosong", 400);
        if (!password || password.trim() === "") throw new ErrorResponse("Password tidak boleh kosong", 400);
        const user = await prisma.user.findUnique({where: {email}});
        if (!user) throw new ErrorResponse("User tidak ditemukan", 404);
        if (!await bcrypt.compare(password, user.password)) throw new ErrorResponse("Password salah", 400);
        const accessToken = jwt.sign({
            sub: user.id,
            email: user.email
        }, process.env.JWT_ACCESS_SECRET, {expiresIn: "15m"});
        const refreshToken = jwt.sign({sub: user.id}, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"});

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000,
            path: "/"
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/v1/auth/refresh"
        })
        return res.status(200).json({status: "success", code: 200, accessToken});

    } catch (error) {
        next(error)
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) throw new ErrorResponse("Unauthorize", 401);
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign(
            {sub: payload.sub},
            process.env.JWT_ACCESS_SECRET,
            {expiresIn: "15m"}
        )
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000,
            path: "/"
        })
        return res.status(200).json({status: "success", code: 200, message: "Berhasil membuat token baru"})
    } catch (error) {
        if (error.name === 'TokenExpiredError') throw new ErrorResponse("Token expired", 401);
        next(error)
    }
}

export const signUp = async (req, res, next) => {
    try {
        const {name, email, password} = req.body;
        if (!name || name.trim() === "") throw new ErrorResponse("Nama tidak boleh kosong", 400);
        if (!email || email.trim() === "") throw new ErrorResponse("Email tidak boleh kosong", 400);
        if (!password || password.trim() === "") throw new ErrorResponse("Password tidak boleh kosong", 400);
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) throw new ErrorResponse("Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol", 400);

        if (!validator.isEmail(email)) throw new ErrorResponse("Email tidak valid", 400);

        const existingEmail = await prisma.user.findUnique({where: {email: email}});
        if (existingEmail) throw new ErrorResponse("Email sudah terdaftar", 400);
        const hashPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {name, email, password: hashPassword},
        });
        return res.status(201).json({status: "success", code: "201", data: user});
    } catch (error) {
        next(error)
    }

}

export const signOut = (req, res) => {
    res.clearCookie("accessToken", {path: "/"});
    res.clearCookie("refreshToken", {path: "/auth/refresh"});
    return res.status(200).json({status: "success", code: 200, message: "Berhasil sign out"});
}

import {PrismaClient} from "@prisma/client";
import validator from "validator";
import {ErrorResponse} from "../utils/errorResponse.js";

const prisma = new PrismaClient();

export const getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany()
        if (users.length === 0) throw new ErrorResponse("User tidak ditemukan", 404);
        return res.status(200).json({status: "success", code: 200, data: users})
    } catch (error) {
        next(error)
    }
}

export const getUserDetails = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const user = await prisma.user.findUnique({where: {id}})
        if (!user) throw new ErrorResponse("Pengguna tidak ditemukan", 404);
        return res.status(200).json({status: "success", code: 200, data: user})
    } catch (error) {
        next(error)
    }
}


export const updateUser = async (req, res, next) => {
    const id = Number(req.params.id);
    const {name, email} = req.body;
    try {
        const user = await prisma.user.findUnique({where: {id}});
        if (!user) throw new ErrorResponse("User tidak ditemukan", 404);
        if (!validator.isEmail(email)) throw new ErrorResponse("Email tidak valid", 400);
        const userUpdate = await prisma.user.update({
            where: {id},
            data: {
                name,
                email,
            }
        })
        return res.status(200).json({status: "success", code: "200", data: userUpdate});
    } catch (error) {
        next(error)
    }

}

export const deleteUser = async (req, res, next) => {
    const id = Number(req.params.id);
    try {
        const user = await prisma.user.findUnique({where: {id}});
        if (!user) throw new ErrorResponse("User tidak ditemukan", 404);
        await prisma.user.delete({where: {id}});
        res.status(200).json({status: "success", code: 200, message: `User ${user.name} berhasil dihapus`});
    } catch (error) {
        next(error)
    }
}
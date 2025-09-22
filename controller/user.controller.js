import {PrismaClient} from "@prisma/client";
import validator from "validator";
import {ErrorResponse} from "../utils/errorResponse.js";
import bcrypt from "bcrypt";

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
        if (!name || name.trim() === "") throw new ErrorResponse("Nama wajib di isi", 404);
        if (!email || email.trim() === "") throw new ErrorResponse("Email wajib di isi", 404);
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

export const updatePassword = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const {currentPassword, newPassword, confirmPassword} = req.body;
        const user = await prisma.user.findUnique({where: {id}});

        if (!user) throw new ErrorResponse("User tidak ditemukan", 404);
        if (!currentPassword || currentPassword.trim() === "") throw new ErrorResponse("Password lama wajib di isi", 400);
        if (!newPassword || newPassword.trim() === "") throw new ErrorResponse("Password baru wajib di isi", 400);
        if (!confirmPassword || confirmPassword.trim() === "") throw new ErrorResponse("Konfirmasi password baru wajib di isi", 400);

        const matchPassword = await bcrypt.compare(currentPassword, user.password)
        if (!matchPassword) throw new ErrorResponse("Password salah", 401);

        if (newPassword !== confirmPassword) throw new ErrorResponse("Konfirmasi password harus sama dengan password baru", 401);
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(newPassword)) throw new ErrorResponse("Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol", 400);
        const hashPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: {id},
            data: {password: hashPassword},
        })
        return res.status(200).json({status: "success", code: 200, message: "Password berhasil di perbaharui"})
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
import {PrismaClient} from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import {ErrorResponse} from "../utils/errorResponse.js";

const prisma = new PrismaClient()


export const getPosts = async (req, res, next) => {
    try {
        const search = (req.query.search || '').trim();
        const by = (req.query.by || 'both').trim();
        const page = Math.max(parseInt(req.query.page || 1), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || 10), 10), 20);
        const skip = (page - 1) * limit;

        let where = {}
        if (search) {
            if (by === "title") {
                where = {title: {contains: search}};
            } else if (by === "content") {
                where = {content: {contains: search}};
            } else {
                where = {
                    OR: [
                        {title: {contains: search}},
                        {content: {contains: search}}
                    ]
                }
            }
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: {createdAt: "desc"},
                skip,
                take: limit,
                select: {title: true, content: true, imagePath: true, createdAt: true}
            }),
            prisma.post.count({where})
        ])
        if (total === 0) return res.status(200).json({
            status: "success",
            code: 200,
            message: "Tidak ada post yang cocok",
            data: posts
        });
        return res.status(200).json({
            status: "success",
            code: 200,
            data: posts,
            pagination: {page, limit, total, pages: Math.ceil(total / limit)}
        });
    } catch (error) {
        next(error)
    }
}

export const getPost = async (req, res, next) => {
    try {
        const {id} = req.params;
        const post = await prisma.post.findUnique({where: {id: id}});
        if (!post) throw new ErrorResponse("Post tidak ditemukan", 404);
        return res.status(200).json({status: "success", code: 200, data: post});
    } catch (error) {
        next(error)
    }
}

export const createPost = async (req, res, next) => {
    try {
        const {title, content} = req.body;
        const image = req.file;
        const authorId = req.user?.id;

        if (!title || title.trim() === "") throw new ErrorResponse("Judul wajib di isi", 400);
        if (!content || content.trim() === "") throw new ErrorResponse("Isi wajib di isi", 400);
        if (!image) throw new ErrorResponse("Gambar wajib di isi", 400);
        const imagePath = `/public/uploads/${image.filename}`;

        const post = await prisma.post.create({
            data: {title, content, authorId, imagePath},
        });

        return res.status(201).json({
            status: "success",
            code: 201,
            message: "Berhasil membuat post baru",
            data: post,
        });
    } catch (error) {
        if (req.file) {
            try {
                await fs.unlink(path.join("public/uploads", req.file.filename));
                console.error("Berhasil hapus file")
            } catch (err) {
                console.log("Gagal hapus file:", err);
            }
        }
        next(error)
    }
};

export const updatePost = async (req, res, next) => {
    try {
        const {id} = req.params
        const {title, content,} = req.body;
        const image = req.file;
        const post = await prisma.post.findUnique({where: {id}});

        if (!post) throw new ErrorResponse(`Post dengan id ${id} tidak ditemukan`, 404);

        if (!title || title.trim() === "") throw new ErrorResponse("Judul wajib di isi", 400);

        if (!content || content.trim() === "") throw new ErrorResponse("Isi wajib di isi", 400);

        if (req.user?.id && post.authorId !== req.user.id) throw new ErrorResponse("Unauthorize", 401);
        let oldImagePath = post.imagePath
        const newImagePath = `/public/uploads/${image.filename}`;
        if (image) {
            if (newImagePath !== oldImagePath) {
                try {
                    const absoluteOldPath = path.join(process.cwd(), oldImagePath.replace(/^\/+/, ""));
                    await fs.unlink(absoluteOldPath);
                } catch (error) {
                    if (error.code === "ENOENT") throw new ErrorResponse("Gagal hapsu file", 400);
                }
            }
        }

        const updatePost = await prisma.post.update({where: {id}, data: {title, content, imagePath: newImagePath}})
        return res.status(200).json({status: "success", code: 200, message: "Berhasil mengupdate post"});
    } catch (error) {
        if (req.file) {
            try {
                await fs.unlink(path.join("public/uploads", req.file.filename));
                console.error("Berhasil hapus file")
            } catch (error) {
                console.log("Gagal hapus file:", error);
            }
        }
        next(error)
    }
}

export const deletePost = async (req, res, next) => {
    try {
        const {id} = req.params
        const post = await prisma.post.findUnique({where: {id}});
        if (!post) throw new ErrorResponse("Post tidak ditemukan", 401);
        await prisma.post.delete({where: {id}});
        if (post.imagePath) {
            try {
                await fs.unlink(path.join(process.cwd(), post.imagePath.replace(/^\/+/, "")))
                console.log("Berhasil menghapus file")
            } catch (error) {
                console.log("Gagal hapus file", error)
            }
        }
        return res.status(200).json({status: "success", code: 200, message: "Berhasil menghapus post"});
    } catch (error) {
        next(error)
    }
}

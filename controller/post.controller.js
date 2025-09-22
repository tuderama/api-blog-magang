import {PrismaClient} from "@prisma/client";
import {put, del} from "@vercel/blob";
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
                select: {id: true, title: true, content: true, imagePath: true, createdAt: true}
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
        if (!image.buffer) throw new ErrorResponse("Upload gagal: buffer kosong", 400);

        const safe = image.originalname.replace(/[^\w.\-]+/g, "_");
        const key = `uploads/${Date.now()}-${safe}`;

        const {url} = await put(key, image.buffer, {
            access: "public",
            contentType: image.mimetype,
        });

        const post = await prisma.post.create({
            data: {title, content, authorId, imagePath: url},
        });

        return res.status(201).json({
            status: "success",
            code: 201,
            message: "Berhasil membuat post baru",
            data: post,
        });
    } catch (error) {
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
        if (!image.buffer) throw new ErrorResponse("Upload gagal: buffer kosong", 400);

        const safe = image.originalname.replace(/[^\w.\-]+/g, "_");
        const key = `uploads/${Date.now()}-${safe}`;

        const {url} = await put(key, image.buffer, {
            access: "public",
            contentType: image.mimetype,
        });

        const updatePost = await prisma.post.update({where: {id}, data: {title, content, imagePath: url}})

        if (post.imagePath && /^https?:\/\//i.test(post.imagePath) && post.imagePath !== url) {
            try {
                await del(post.imagePath);
            } catch (error) {
                console.log("Gagal hapus file", error)
            }
        }

        return res.status(200).json({status: "success", code: 200, message: "Berhasil mengupdate post"});
    } catch (error) {
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
                await del(post.imagePath);
            } catch (error) {
                console.log("Gagal hapus file", error)
            }
        }
        return res.status(200).json({status: "success", code: 200, message: "Berhasil menghapus post"});
    } catch (error) {
        next(error)
    }
}


import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${randomUUID()}${path.extname(file.name)}`;
        const publicPath = path.join(process.cwd(), "public/uploads", filename);

        await writeFile(publicPath, buffer);

        return NextResponse.json({
            message: "Success",
            path: `/uploads/${filename}`
        }, { status: 201 });

    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}

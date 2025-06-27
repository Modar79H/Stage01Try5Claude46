// app/api/settings/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let imagePath: string | null = null;

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create upload directory
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "profiles",
      );
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const fileExtension = imageFile.name.split(".").pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file
      await writeFile(filePath, buffer);
      imagePath = `/uploads/profiles/${fileName}`;
    }

    // Update user profile
    const updateData: any = { name };
    if (imagePath) {
      updateData.image = imagePath;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

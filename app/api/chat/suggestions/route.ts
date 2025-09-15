import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { chatbotService } from "@/lib/services/chatbot";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const context = await chatbotService.buildContext(
      session.user.id,
      productId || undefined,
    );

    const suggestions = chatbotService.generateSuggestedPrompts(context);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Chat suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 },
    );
  }
}

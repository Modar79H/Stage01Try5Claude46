import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { chatbotService } from "@/lib/services/chatbot";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message, brandId, productId, stream = true } = body;

    // Create new conversation if not provided
    let convId = conversationId;
    if (!convId) {
      convId = await chatbotService.createConversation(
        session.user.id,
        brandId,
        productId,
      );
    }

    // For now, always use non-streaming response
    const response = await chatbotService.generateResponse(convId, message);

    return NextResponse.json({
      conversationId: convId,
      ...response,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active conversations
    const conversations = await chatbotService.getActiveConversations(
      session.user.id,
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Chat list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

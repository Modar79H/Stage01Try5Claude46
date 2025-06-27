import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import { pineconeService } from "./pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
}

export interface ChatbotResponse {
  message: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    suggestedPrompts?: string[];
    context?: any;
  };
}

class ChatbotService {
  async createConversation(
    userId: string,
    brandId?: string,
    productId?: string,
    title?: string,
  ): Promise<string> {
    console.log("DEBUG: Creating conversation with:", {
      userId,
      brandId,
      productId,
    });

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        brandId,
        productId,
        title: title || "New Marketing Strategy Conversation",
        isActive: true,
        context: {},
      },
    });
    return conversation.id;
  }

  async buildContext(
    userId: string,
    brandId?: string,
    productId?: string,
    query?: string,
  ): Promise<any> {
    let context: any = {
      user: { id: userId },
      analyses: [],
      competitors: [],
    };

    // Get product and related data if specified
    if (productId) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            analyses: {
              where: { status: "completed" },
            },
            competitors: true,
            brand: true,
          },
        });

        if (product) {
          context.product = product;
          context.brand = product.brand;
          context.analyses = product.analyses;
          context.competitors = product.competitors;

          // Reviews are no longer included in chatbot context
          // The chatbot only has access to the 11 analyses
        }
      } catch (error) {
        console.error("Error fetching product context:", error);
      }
    } else if (brandId) {
      try {
        const brand = await prisma.brand.findUnique({
          where: { id: brandId },
          include: {
            products: {
              include: {
                analyses: {
                  where: { status: "completed" },
                },
              },
            },
          },
        });

        if (brand) {
          context.brand = brand;
          context.products = brand.products;
          // Aggregate analyses from all products
          context.analyses = brand.products.flatMap((p) => p.analyses);
        }
      } catch (error) {
        console.error("Error fetching brand context:", error);
      }
    }

    return context;
  }

  private buildSystemPrompt(context: any): string {
    let prompt = `You are a senior marketing strategist with 20+ years of experience across B2B, B2C, and D2C markets. You've led marketing at Fortune 500 companies and successful startups, with deep expertise in:

- Brand strategy and positioning
- Digital marketing (SEO, SEM, social media, email, content)
- Marketing analytics and attribution modeling
- Customer segmentation and personas
- Go-to-market strategy
- Marketing automation and MarTech stacks
- Growth hacking and conversion optimization
- Budget allocation and ROI measurement
- Social media platforms across Facebook, Instagram, TikTok, LinkedIn, Twitter/X, Pinterest, YouTube, and emerging platforms
- Current social media platform's algorithm changes, content formats, and user behavior patterns
- Advertising proficiency including campaign structure, targeting options, bidding strategies, and creative best practices across different platforms
- Social media platform selection based on:
  - Product-audience fit analysis
  - Customer demographic alignment
  - Content type optimization (video-first vs. image vs. text)
  - Budget efficiency and ROI potential
  - Organic reach opportunities
- Creative formats (Reels, Stories, Carousels, Lives, etc.)
- Influencer collaboration strategies per platform
- Community management best practices
- Social commerce features and implementation

Before you respond you must:
1. First understand my context (industry, target audience, current situation)
2. Identify the core marketing challenges and opportunities
3. Provide actionable recommendations prioritized by impact
4. Suggest specific tools, tactics, and channels

Your response style:
- Ask clarifying questions if require
- Provide data-driven recommendations with specific metrics/KPIs
- Consider both short-term wins and long-term strategy
- Explain the "why" behind each recommendation
- Offer alternative approaches with pros/cons
- Include implementation timelines and resource requirements
- Always reference specific insights from the analysis when making recommendations
- Quantify suggestions with metrics (e.g., "77% of negative reviews mention X")
- Use clear, professional yet engaging language while remaining conversational

You have access to 11 comprehensive analyses that provide deep insights into customer behavior, sentiment, personas, competitive positioning, and strategic recommendations.

CONTEXT AVAILABLE:
`;

    if (context.brand) {
      prompt += `\nBrand: ${context.brand.name}`;
    }

    if (context.product) {
      prompt += `\nProduct: ${context.product.name}`;
      prompt += `\nTotal Reviews: ${context.product.reviewsCount}`;
    }

    if (context.analyses && context.analyses.length > 0) {
      prompt += `\n\nAVAILABLE ANALYSES:`;
      context.analyses.forEach((analysis: any) => {
        prompt += `\n\n${analysis.type.toUpperCase()} ANALYSIS:`;
        try {
          const data =
            typeof analysis.data === "string"
              ? JSON.parse(analysis.data)
              : analysis.data;
          prompt += `\n${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          prompt += `\n${analysis.data}`;
        }
      });
    }

    // Reviews are no longer included in the system prompt
    // The chatbot only has access to the 11 analyses

    if (context.competitors && context.competitors.length > 0) {
      prompt += `\n\nCOMPETITOR DATA AVAILABLE:`;
      context.competitors.forEach((comp: any) => {
        prompt += `\n- ${comp.name}`;
      });
    }

    prompt += `\n\nIMPORTANT REMINDERS:
1. Always ground your recommendations in the specific data from the analyses above
2. Quantify insights with exact percentages and numbers from the analyses
3. Prioritize recommendations by potential impact and feasibility
4. Include specific platform recommendations based on the target audience data
5. Suggest concrete metrics and KPIs to track success
6. Provide timeline estimates for implementation
7. Consider budget implications and ROI potential
8. Reference competitor strategies when relevant
9. Acknowledge data limitations and suggest additional research if needed
10. Balance quick wins with long-term strategic initiatives

Remember: You have access to REAL customer data and comprehensive analyses. Every recommendation must be backed by specific insights from the data provided above. Avoid generic advice - be specific, actionable, and data-driven.`;

    return prompt;
  }

  async generateResponse(
    conversationId: string,
    userMessage: string,
  ): Promise<ChatbotResponse> {
    try {
      // Get conversation details
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          user: true,
          brand: true,
          product: true,
        },
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId,
          role: "user",
          content: userMessage,
        },
      });

      // Build intelligent context based on user's data
      const context = await this.buildContext(
        conversation.userId,
        conversation.brandId || undefined,
        conversation.productId || undefined,
        userMessage,
      );

      // DEBUG: Log what context we got
      console.log("DEBUG: Context built:", {
        hasProduct: !!context.product,
        productName: context.product?.name,
        analysesCount: context.analyses?.length || 0,
        analysisTypes: context.analyses?.map((a: any) => a.type) || [],
      });

      // Get conversation history for context
      const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 6, // Last 6 messages for context
      });

      const history = recentMessages.reverse().map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Build comprehensive system prompt with actual data
      const systemPrompt = this.buildSystemPrompt(context);

      // DEBUG: Log the system prompt
      console.log("DEBUG: System prompt length:", systemPrompt.length);
      console.log(
        "DEBUG: System prompt preview:",
        systemPrompt.substring(0, 500),
      );

      // Create messages array with context
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-4), // Last 4 messages for continuity
        { role: "user" as const, content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      const assistantMessage =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response. Please try again.";

      // Save assistant message
      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: assistantMessage,
          metadata: {
            model: "gpt-4o",
            context: {
              analysesUsed: context.analyses?.map((a: any) => a.type) || [],
              hasProductContext: !!context.product,
              hasBrandContext: !!context.brand,
            },
          },
        },
      });

      // Generate smart suggestions based on context
      const suggestedPrompts = this.generateSmartSuggestions(
        context,
        userMessage,
      );

      return {
        message: assistantMessage,
        metadata: {
          sources: this.extractSources(context),
          confidence: 0.9,
          suggestedPrompts,
          context: {
            brandName: context.brand?.name,
            productName: context.product?.name,
            analysesAvailable: context.analyses?.map((a: any) => a.type) || [],
          },
        },
      };
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      throw error;
    }
  }

  private extractSources(context: any): string[] {
    const sources: string[] = [];

    if (context.analyses && context.analyses.length > 0) {
      sources.push(...context.analyses.map((a: any) => `${a.type} analysis`));
    }

    if (context.competitors && context.competitors.length > 0) {
      sources.push(`${context.competitors.length} competitor profiles`);
    }

    return sources;
  }

  private generateSmartSuggestions(
    context: any,
    lastMessage: string,
  ): string[] {
    const prompts: string[] = [];

    // Context-based intelligent suggestions
    if (context.analyses?.some((a: any) => a.type === "sentiment")) {
      prompts.push("What are my customers' biggest pain points?");
      prompts.push("How can I address negative feedback effectively?");
    }

    if (context.analyses?.some((a: any) => a.type === "personas")) {
      prompts.push("Who should I target in my next marketing campaign?");
      prompts.push(
        "How should I tailor messaging for different customer segments?",
      );
    }

    if (context.analyses?.some((a: any) => a.type === "competition")) {
      prompts.push("How do I differentiate from my main competitors?");
      prompts.push("What competitive advantages should I highlight?");
    }

    if (
      context.analyses?.some((a: any) => a.type === "strategic_recommendations")
    ) {
      prompts.push("What should be my top 3 priorities for improvement?");
    }

    // Always include these practical suggestions
    prompts.push("Create a 30-day marketing action plan based on my data");
    prompts.push("Generate content ideas based on positive customer feedback");
    prompts.push("What marketing channels should I focus on?");

    // Return 4 most relevant
    return prompts.slice(0, 4);
  }

  generateSuggestedPrompts(context?: any): string[] {
    if (!context) {
      return [
        "What are my customers saying about my product?",
        "How can I improve customer satisfaction?",
        "Create a marketing strategy based on my reviews",
        "What are my main competitive advantages?",
      ];
    }

    return this.generateSmartSuggestions(context, "");
  }

  async getActiveConversations(userId: string): Promise<any[]> {
    return prisma.conversation.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        brand: true,
        product: true,
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      metadata: msg.metadata,
    }));
  }

  async exportConversation(conversationId: string): Promise<string> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: true,
        brand: true,
        product: true,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    let markdown = `# Marketing Strategy Consultation\n\n`;
    markdown += `**Date:** ${conversation.createdAt.toLocaleDateString()}\n`;
    markdown += `**User:** ${conversation.user.email}\n`;

    if (conversation.brand) {
      markdown += `**Brand:** ${conversation.brand.name}\n`;
    }

    if (conversation.product) {
      markdown += `**Product:** ${conversation.product.name}\n`;
    }

    markdown += `\n---\n\n`;

    conversation.messages.forEach((message) => {
      if (message.role === "user") {
        markdown += `### Question:\n${message.content}\n\n`;
      } else {
        markdown += `### Marketing Strategist Recommendation:\n${message.content}\n\n`;
      }
    });

    return markdown;
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });
  }
}

export const chatbotService = new ChatbotService();

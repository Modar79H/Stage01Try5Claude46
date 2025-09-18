import { OpenAI } from "openai";
import { ReviewMetadata } from "./pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisResult {
  type: string;
  data: Record<string, any>;
  status: "completed" | "failed";
  error?: string;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
}

class OpenAIAnalysisService {
  private analysisTokenUsage: Map<string, TokenUsage> = new Map();

  async performAnalysis(
    analysisType: string,
    reviews: ReviewMetadata[],
    competitorReviews?: ReviewMetadata[],
    existingAnalyses?: Record<string, any>,
    productVariations?: Record<string, { count: number; description?: string }>,
    productId?: string,
    userId?: string,
    brandId?: string,
    competitorName?: string,
  ): Promise<AnalysisResult> {
    try {
      const logPrefix = competitorName
        ? `Starting ${analysisType} analysis for competitor ${competitorName} with`
        : `Starting ${analysisType} analysis with`;
      console.log(`${logPrefix} ${reviews.length} reviews`);

      // Special handling for percentage_calculation
      if (analysisType === "percentage_calculation") {
        return await this.calculateActualPercentages(
          productId!,
          userId!,
          brandId!,
          existingAnalyses!,
        );
      }

      // Log additional details for smart_competition
      if (analysisType === "smart_competition") {
        const competitorCount = existingAnalyses?.competitorAnalyses
          ? Object.keys(existingAnalyses.competitorAnalyses).length
          : 0;
        console.log(
          `🎯 Smart Competition Analysis - Found ${competitorCount} competitors:`,
          existingAnalyses?.competitorAnalyses
            ? Object.keys(existingAnalyses.competitorAnalyses).map(
                (id) => (existingAnalyses.competitorAnalyses[id] as any).name,
              )
            : [],
        );
        console.log(
          `📊 Competitor analyses keys:`,
          existingAnalyses?.competitorAnalyses
            ? Object.keys(existingAnalyses.competitorAnalyses)
            : [],
        );
      }

      // Initialize token tracking for this analysis
      this.analysisTokenUsage.set(analysisType, {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost: 0,
      });

      // List of analysis types that need temporal analysis
      const temporalAnalysisTypes = ["sentiment", "four_w_matrix", "swot"];

      // Check if this analysis type needs temporal enhancement
      const needsTemporalAnalysis =
        temporalAnalysisTypes.includes(analysisType);

      const systemPrompt = this.getSystemPrompt(analysisType);
      const userPrompt = this.buildUserPrompt(
        analysisType,
        reviews,
        competitorReviews,
        existingAnalyses,
        productVariations,
      );

      // Log prompt sizes for debugging large prompts
      if (
        analysisType === "smart_competition" ||
        analysisType === "strategic_recommendations"
      ) {
        console.log(`📐 ${analysisType.toUpperCase()} Prompt Sizes:`);
        console.log(`   System prompt: ${systemPrompt.length} characters`);
        console.log(`   User prompt: ${userPrompt.length} characters`);
        console.log(
          `   Total: ${(systemPrompt.length + userPrompt.length).toLocaleString()} characters`,
        );
        console.log(
          `   Estimated tokens: ~${Math.round((systemPrompt.length + userPrompt.length) / 4)} tokens`,
        );
      }

      // First stage: Initial analysis to identify topics
      // Retry logic for API failures
      let completion;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          const isProductDescription = analysisType === "product_description";
          const baseParams: any = {
            model: isProductDescription ? "gpt-4o-mini" : "gpt-5-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          };

          // Different parameters for different models
          if (isProductDescription) {
            // GPT-4o-mini parameters
            baseParams.temperature = 0.1;
            baseParams.max_tokens = 6000;
          } else {
            // GPT-5-mini parameters
            baseParams.max_completion_tokens =
              analysisType === "smart_competition" ||
              analysisType === "strategic_recommendations"
                ? 12000
                : analysisType === "stp" || analysisType === "customer_journey"
                  ? 10000
                  : 6000;
            baseParams.reasoning_effort = "minimal";
          }

          completion = await openai.chat.completions.create(baseParams);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          retries--;
          if (retries > 0) {
            console.log(
              `OpenAI API error for ${analysisType}, retrying... (${retries} retries left)`,
            );
            if (analysisType === "smart_competition") {
              console.error(`Smart Competition Error Details:`, error);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          }
        }
      }

      if (!completion) {
        throw (
          lastError ||
          new Error("Failed to get response from OpenAI after 3 retries")
        );
      }

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content from OpenAI");
      }

      // Log actual model used and token usage
      const usage = completion.usage;
      if (usage) {
        console.log(`📊 ${analysisType.toUpperCase()} STAGE 1 TOKEN USAGE:`);
        console.log(`   🤖 Model used: ${completion.model}`);
        console.log(
          `   📝 Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`,
        );
        console.log(
          `   🤖 Completion tokens: ${usage.completion_tokens.toLocaleString()}`,
        );
        console.log(
          `   🔢 Total tokens: ${usage.total_tokens.toLocaleString()}`,
        );

        // Accumulate tokens for this analysis
        const currentUsage = this.analysisTokenUsage.get(analysisType)!;
        currentUsage.prompt_tokens += usage.prompt_tokens;
        currentUsage.completion_tokens += usage.completion_tokens;
        currentUsage.total_tokens += usage.total_tokens;
        currentUsage.cost += 0; // Keep for compatibility but set to 0
      }

      let data = JSON.parse(content);

      // Second stage: Topic-specific temporal analysis (if needed)
      let totalApiCalls = 1; // Initial analysis call
      if (needsTemporalAnalysis && productId && userId && brandId) {
        console.log(
          `Performing topic-specific temporal analysis for ${analysisType.toUpperCase()} analysis`,
        );
        const { data: enhancedData, apiCalls } =
          await this.enhanceWithTemporalAnalysis(
            analysisType,
            data,
            productId,
            userId,
            brandId,
          );
        data = enhancedData;
        totalApiCalls += apiCalls;
      }

      // Log final token usage summary for this analysis
      const finalUsage = this.analysisTokenUsage.get(analysisType);
      if (finalUsage) {
        console.log(
          `🎯 ${analysisType.toUpperCase()} TOTAL TOKEN USAGE SUMMARY:`,
        );
        console.log(
          `   📝 Total Prompt tokens: ${finalUsage.prompt_tokens.toLocaleString()}`,
        );
        console.log(
          `   🤖 Total Completion tokens: ${finalUsage.completion_tokens.toLocaleString()}`,
        );
        console.log(
          `   🔢 Total tokens: ${finalUsage.total_tokens.toLocaleString()}`,
        );
        console.log(`   🔄 Total API calls: ${totalApiCalls}`);
        console.log(
          `   ⚡ Average tokens per API call: ${Math.round(finalUsage.total_tokens / totalApiCalls)}`,
        );
      }

      return {
        type: analysisType,
        data,
        status: "completed",
      };
    } catch (error) {
      console.error(`Error in ${analysisType} analysis:`, error);
      return {
        type: analysisType,
        data: {},
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async generatePersonaImage(
    personaDescription: string,
  ): Promise<string | null> {
    try {
      // Import Replicate service dynamically to avoid circular imports
      const { replicateService } = await import("./replicate");

      return await replicateService.generatePersonaImage(personaDescription);
    } catch (error) {
      console.error("Error generating persona image:", error);
      return null;
    }
  }

  // Special SWOT analysis for competitors (only Strengths and Weaknesses)
  async performCompetitorSWOTAnalysis(
    reviews: ReviewMetadata[],
    competitorVariations?: Record<
      string,
      { count: number; description?: string }
    >,
  ): Promise<AnalysisResult> {
    try {
      console.log(
        `Starting competitor SWOT analysis with ${reviews.length} reviews`,
      );

      const systemPrompt = `You are a Brand Strategy Analyst with over 10 years of experience analyzing competitor products.

You are highly skilled in:
- Identifying themes in review datasets
- Understanding emotional tone and contextual clues within natural language
- Creating SWOT Analysis focused on Strengths and Weaknesses only

Your job is:
- Conduct a Strengths and Weaknesses analysis based on competitor reviews
- Strengths – What customers love about this competitor. Consider all themes/topics represent up from 5% of the reviews.
- Weaknesses – What customers criticize about this competitor. Consider all themes/topics represent up from 5% of the reviews.
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "swot_analysis": {
    "strengths": [
      {
        "topic": "Topic name",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "weaknesses": [
      {
        "topic": "Topic name",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ]
  }
}`;

      const userPrompt = this.buildUserPrompt(
        "swot",
        reviews,
        undefined,
        undefined,
        competitorVariations,
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 6000,
        reasoning_effort: "minimal",
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Log token usage for competitor SWOT analysis
      const usage = completion.usage;
      if (usage) {
        console.log(`📊 COMPETITOR SWOT ANALYSIS TOKEN USAGE:`);
        console.log(`   🤖 Model used: ${completion.model}`);
        console.log(
          `   📝 Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`,
        );
        console.log(
          `   🤖 Completion tokens: ${usage.completion_tokens.toLocaleString()}`,
        );
        console.log(
          `   🔢 Total tokens: ${usage.total_tokens.toLocaleString()}`,
        );
      }

      console.log(`✅ SWOT analysis completed for competitor`);

      const data = JSON.parse(content);

      return {
        type: "swot",
        data,
        status: "completed",
      };
    } catch (error) {
      console.error("Error in competitor SWOT analysis:", error);
      return {
        type: "swot",
        data: {},
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const basePrompt = `You are a senior data analyst and e-commerce product insight strategist with over 10 years of experience working with review data for global brands. You consistently deliver structured, accurate, and business-ready analyses. Your writing is clear, engaging, neutral, and tailored to executives, brand owners, and marketers. You never fabricate data, and all insights must be grounded in the provided review content.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.`;

    const specificPrompts = {
      product_description: `You are a senior data analyst with over 10 years of experience in e-commerce analysis.

You are highly skilled in detecting key patterns in product review data

Your job is to:
- Extract ONLY objective, measurable, and factual product attributes - NOT opinions, experiences, or subjective qualities.
Objective Specifications: Including -but not limited to:
•	Physical dimensions: e.g., size, length, width, height, thickness, diameter
•	Measurable properties: e.g., weight, capacity, quantity, count
•	Material composition: e.g., cotton, rubber, plastic, wood
•	Manufacturing details: e.g., construction method, country of origin
•	Technical specifications: e.g., power requirements, compatibility
•	Factual features: e.g., number of pieces, included accessories
•	Care instructions: e.g., machine washable, hand wash only, dry clean
•	Certifications: e.g., safety standards, warranties
EXCLUDE (Subjective Qualities):
•	Sensory descriptions: e.g., soft, comfortable, rough, smooth
•	Value judgments: e.g., good quality, cheap, worth it, disappointing
•	Comparative statements: e.g., bigger than expected, true to size
•	Performance opinions: e.g., works well, doesn't slip, holds up
•	Aesthetic opinions: e.g., beautiful, ugly, cute, stylish
STANDARDIZATION:
•	Convert to standard units (24" instead of "2 feet")
•	Use consistent terminology
- Create a product description: a concise, neutral and objective review of the product's features and specifications (e.g. material, size, dimensions, weight, colors, flavor,..etc) focusing on product's attributes not the reviewers' opinion.
- Identify product's variations -if applicable-: different variations can be based on size, color, pattern, design, quantity, Etc

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "product_description": {
    "summary": "Short paragraph presenting a general description of the product",
    "attributes": ["Attribute 1", "Attribute 2"],
    "variations": ["Variation 1", "Variation 2"]
  }
}`,

      sentiment: `You are a Customer Insight Analyst with over 10 years of experience in analyzing customer feedback.

You are highly skilled in:
- Identifying themes in review datasets
- Extracting what customers like (value drivers) and dislike (friction points)

Your job is to:
- Extract up to ten themes/topics represent what the customers like (what they love, appreciate, or praise), and up to ten themes/topics represent what the customers dislikes (what they complain about or want improved).
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "sentiment_analysis": {
    "customer_likes": [
      {
        "theme": "Theme name",
        "summary": "Brief paragraph summarizing trends",
        "example_quote": "Customer quote",
        "variation_specific": "Variation name if this theme is specific to certain variations, or null"
      }
    ],
    "customer_dislikes": [
      {
        "theme": "Theme name",
        "summary": "Brief paragraph summarizing trends",
        "example_quote": "Customer quote",
        "variation_specific": "Variation name if this theme is specific to certain variations, or null"
      }
    ],
    "variation_insights": {
      "summary": "Overview of how sentiment differs across product variations if applicable"
    }
  }
}`,

      voice_of_customer: `You are a Customer Insight Analyst specializing in extracting meaningful keywords from product reviews.

You are highly skilled in:
- Identifying themes in review datasets 
- Extracting the most frequently used words

Your job is to:
- Analyze customer reviews and extract up to 30 most frequently mentioned MEANINGFUL words/phrases
PREPROCESSING RULES:
- Normalize text: Convert to lowercase, remove punctuation
- Combine related terms: 
   - Treat "box" and "colors" as "boxes"
   - Treat "cream" and "creamy" as "cream"
- Keep compound terms that are meaningful together (e.g., "bath mat", "non-slip")
- EXCLUDE:
   - Generic words (articles, pronouns, conjunctions)
   - Single letters or numbers
   - Words with less than 3 characters (unless meaningful like "mat")

EXTRACTION RULES:
- Focus on DESCRIPTIVE words (adjectives, nouns) that provide insight about the product
- Combine singular/plural forms into single entry
- For compound concepts, decide if they're more meaningful together or separate
- Count actual frequency of the base concept (combining all variations)

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.


Response format:
{
  "voice_of_customer": {
    "keywords": [
      {"word": "keyword1", "frequency": 45},
      {"word": "keyword2", "frequency": 32}
    ]
  }
}`,

      four_w_matrix: `You are a Consumer Insights Strategist with over 10 years of experience and have deep expertise in review analytics, contextual theme detection, and behavioral audience mapping.

You are highly skilled in:
- Identifying themes in review datasets.
- Identifying WHO is buying the product, WHAT the product is used as/for, WHERE it is placed/used in, and WHEN it is used (e.g. time/date) and purchased (any special occasion e.g. Christmas, Birthday).

Your job is:
- Perform a Who / What / Where / When Matrix Analysis by extracting:
- WHO: User Demographics & Relationships. Define: People who buy OR use the product. Examples: parents, students, pet owners, gifters. Exclusions: Generic terms like "customers" or "people". Consider up to seven themes/topics have most representing in the reviews.
- WHAT: Use Cases & Applications. Define: How product solves problems or creates value. Examples: entertainment, safety, health, gift. Consider up to seven themes/topics have most representing in the reviews.
- WHERE: Physical Locations. Define: Rooms or spaces where product is used. Examples: outdoor, car, office, kitchen. Consider up to seven themes/topics have most representing in the reviews.
- WHEN: Temporal Patterns. Consider purchase triggers (e.g., occasions, holidays, birthdays, moving), life events (e.g., graduation, new pet), usage patterns & frequency (e.g., daily, seasonal, occasional) and situations (e.g., morning routine, cold weather). Consider up to seven themes/topics have most representing in the reviews.
- Note: Avoid overlap inside a category. Each topic should be mutually exclusive within its category. In case of duplication choose most specific use case

- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "four_w_matrix": {
    "who": [
      {
        "topic": "Topic name",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "what": [],
    "where": [],
    "when": []
  }
}`,

      jtbd: `You are a Consumer Insights Strategist with over 10 years of experience and have deep expertise in review analytics, contextual theme detection, and behavioral audience mapping.

You are highly skilled in:
- Identifying themes in review datasets.
- Understanding customer intent based on natural language in reviews
- Using the Christensen methodology to identify three JTBD layers: Functional Jobs, Emotional Jobs, and Social Jobs.

Your job is:
- By using the Christensen methodology create the three JTBD categories:
- Functional jobs (practical tasks). Consider up to five jobs have most representing in the reviews.
- Emotional jobs (feelings/desires). Consider up to five jobs have most representing in the reviews.
- Social jobs (social context). Consider up to five jobs have most representing in the reviews.
- For each job identify: the job, job statement (the Tony Ulwick's structure: When [condition], I want [action], so that [outcome]).
- Provide real snippet or quote from the reviews


CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "jtbd_analysis": {
    "functional_jobs": [
      {
        "job": "Job name",
        "job_statement": "When [condition], I want [action], so that [outcome]",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "emotional_jobs": [],
    "social_jobs": []
  }
}`,

      stp: `You are a Strategic Marketing Consultant and Customer Insights Strategist with over 10 years of experience and have advanced skills in audience segmentation, behavioral targeting, and brand positioning based on product reviews.

You are highly skilled in:
- Identifying themes in review datasets.
- Analyzing natural language to detect audience types, emotional needs, and use context.
- Customer persona segmentation, behavioral analysis, and emotional language modelling based on customer reviews.
- Creating STP Analysis (Segmentation, Targeting, Positioning) including what's the best targeting approach to select (Undifferentiated, Differentiated, or Concentrated), developing a clear positioning statement that defines how the product should be perceived by the target segment(s), outline the unique value proposition tailored to the target audience, implementing 4Ps (Product, Price, Place, Promotion) – Suggesting implementations to support the positioning, and suggesting ideas for messaging and communication channels.
- Extracting persona patterns from customer reviews.

Your job is:
- Conduct a full Segmentation → Targeting → Positioning analysis as follows:

1. Market Definition:
- Define the overall market and industry context relevant to the product. 
- Describe customer needs and competitive environment.

2. Segmentation:
- Identify and describe meaningful market segments based on relevant criteria such as demographics, psychographics, geography, and behavior. Consider up to five segments have most representing in the reviews.
- Assess the attractiveness, opportunities, and challenges of each segment considering size, growth potential, profitability, accessibility, and competition.  
- Highlight any unique needs or differentiators within segments.
- Provide real snippet or quote from the reviews
- generate a buyer persona represent each segment. Each persona has a name and a Persona Snapshot Summary: "Hi I'm Sara, a 32-year-old teacher"

The Persona elements:
1) Demographics: Basic profile to humanize the persona: Age, Education level, Job title/occupation, Income range (if relevant), Living environment (e.g., city, suburb, rural)
2) Psychographics: Core values (e.g., quality, convenience, sustainability), Lifestyle (e.g., minimalist, nerd, parent, pet lover), Personality traits (e.g., cautious, trend-seeker, impulsive), Hobbies and interests
3) Goals & Motivations: What they want to achieve with the product
4) Pain Points / Frustrations: Problems they're trying to solve: Product-related issues (e.g., "product is cheap-looking"), Emotional pain (e.g., "I want to buy a meaningful gift but don't know what"), Functional pain (e.g., "Hard to maintain, low quality")
5) Buying Behavior: How they shop and decide: Purchase channels (Amazon, TikTok, Google, in-store), Research habits (do they read reviews, compare alternatives?), Decision triggers (price, visuals, social proof, urgency), Objections or barriers (e.g., delivery delay, perceived cheapness)
6) Product Use Behavior: How often they use the product: In what context (home, office, gift), Who uses it (self, child, pet), How they maintain it (e.g., regular cleaning)
7) Influencers & Information Sources: What platforms they use (e.g., TikTok, Reddit, Instagram), Who they trust (e.g., influencers, Amazon reviews, friends), What content they consume (e.g., memes, review videos)
8) Day in the Life: A 150–200 words paragraph of a typical day for the persona. Write it as a narrative that follows the persona from morning to evening. Include their routines, work or study habits, hobbies, social activities, and interactions with the product. Show their emotions, motivations, and small lifestyle choices throughout the day. Describe where they spend time (home, commute, workplace, social spaces) and how they balance responsibilities with personal interests. Highlight details that connect to their personality and values. Focus on storytelling rather than just a list of activities.

2. Targeting:
Generate a targeting approach (e.g., undifferentiated, differentiated, concentrated).

3. Positioning:
- Develop a clear positioning statement that defines how the product should be perceived by the target segment.  
- Outline the unique value proposition tailored to the target audience.  
- 4Ps Implementation: Suggest marketing mix elements (Product, Price, Place, Promotion) to support the positioning.  
- Include ideas for messaging and communication channels.

4. Implementation Recommendations
- Provide actionable marketing tactics and suggestions for execution.  
- Recommend ways to monitor and refine the STP strategy over time.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "stp_analysis": {
    "market_definition": "Market description",
    "segmentation": [
      {
        "segment": "Segment name",
        "description": "Segment description",
        "attractiveness_factors": "Factors",
        "opportunities": "Opportunities",
        "challenges": "Challenges",
        "example_quote": "Customer quote",
        "buyer_persona": {
          "persona_name": "Name",
          "persona_intro": "Hi, I'm [name], a [age]-year-old [job]",
          "demographics": {
            "age": "Age range",
            "education_level": "Education",
            "job_title": "Job",
            "income_range": "Income",
            "living_environment": "Environment"
          },
          "psychographics": {
            "core_values": "Values",
            "lifestyle": "Lifestyle",
            "personality_traits": "Traits",
            "hobbies_interests": "Hobbies"
          },
          "goals_motivations": ["Goal 1", "Goal 2"],
          "pain_points_frustrations": ["Pain 1", "Pain 2"],
          "buying_behavior": {
            "purchase_channels": "Channels",
            "research_habits": "Habits",
            "decision_triggers": "Triggers",
            "objections_barriers": "Barriers"
          },
          "product_use_behavior": ["Behavior 1", "Behavior 2"],
          "influencers_information_sources": {
            "platforms": "Platforms",
            "trusted_sources": "Sources",
            "content_consumed": "Content"
          },
          "day_in_the_life": "Typical day description"
        }
      }
    ],
    "targeting_strategy": {
      "selected_segments": "Selected segments",
      "approach_description": "Approach",
      "buyer_personas": "Personas"
    },
    "positioning_strategy": {
      "positioning_statement": "Statement",
      "unique_value_proposition": "UVP",
      "marketing_mix": "Marketing mix",
      "messaging_channels": "Channels"
    },
    "implementation_recommendations": {
      "key_tactics": "Tactics",
      "monitoring_suggestions": "Monitoring"
    }
  }
}`,

      swot: `You are a Brand Strategy Analyst with over 10 years of experience and have expert-level skills in customer review analysis, market risk profiling, and SWOT modelling for consumer brands. You specialize in extracting actionable insights from customer feedback.

You are highly skilled in:
- Identifying themes in review datasets.
- Understanding emotional tone, complaints, and contextual clues within natural language.
- Creating SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats).

Your job is:
1. Conduct a full SWOT Analysis based on how frequently different themes appear in the reviews. Use natural language clues to classify:
- Strengths – What customers love. Consider up to seven themes/topics have most representing in the reviews.
- Weaknesses – What customers criticize. Consider up to seven themes/topics have most representing in the reviews.
- Opportunities – Where the brand can grow. Consider up to five themes/topics have most representing in the reviews.
- Threats – Signals of dissatisfaction or damage risk. Consider up to five themes/topics have most representing in the reviews.
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "swot_analysis": {
    "strengths": [
      {
        "topic": "Topic name",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  }
}`,

      customer_journey: `You are a Customer Experience Strategist with over 10 years of experience and have advanced skills in journey design, review interpretation, and emotional insight modelling. You specialize in extracting full-funnel customer experiences from product review data.

You are highly skilled in:
- Identifying themes in review datasets.
- Tracking behavior patterns and friction points across the journey lifecycle.
- Creating Customer Journey Mapping analysis.

Your job is:
1. Generate a Customer Journey Mapping analysis by breaking the customer journey into the following six stages:
- Awareness – How do customers first discover the product? Consider up to five themes/topics have most representing in the reviews.
- Consideration – How they proceed the research phase (e.g., reviews, price comparisons), and what factors influence their decision? Consider up to five themes/topics have most representing in the reviews.
- Purchase – How do customers describe the buying process, shipping, or delivery timelines? Consider up to five themes/topics have most representing in the reviews.
- Delivery/Unboxing – The moment of receiving the product, what was the first impression? Are there any packaging issues? Do reviews mention unboxing surprises (whether negative or positive)? Consider up to five themes/topics have most representing in the reviews.
- Usage – Where and how is the product used? How they feel about the product? Consider up to five themes/topics have most representing in the reviews.
- Post-Purchase – Do customers return, complain, reorder, or recommend? Mention positive promoters and negative detractors. Consider up to five themes/topics have most representing in the reviews.
- Provide real snippet or quote from the reviews

2. For each stage:
- Identify Customer Actions: The specific activities or behaviors the customer performs at each stage (e.g., researching products, reading reviews, making a purchase, or sharing feedback). These describe what the customer does during that stage.
- Identify Touchpoints: The direct interactions or points of contact between the customer and the product during each stage (e.g., social media, Instagram, Amazon, websites).
- Identify Emotions: What were the feelings, sentiments, or emotional responses experienced by the customer at each stage.
- Identify Pain Points: What were the challenges, obstacles, or frustrations customers encounter at each stage that negatively impact their experience or decision-making.
- Identify Opportunities: Potential areas or ideas for enhancing the customer experience, addressing pain points, or capitalizing on positive moments to improve satisfaction, loyalty, or conversion rates.

3. Any topic must be grounded in the provided review content. In case you couldn’t find enough information to create any of the topics do not fabricate any of them, just return “No supporting data available”

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "customer_journey": {
    "awareness": [
      {
        "topic": "Topic name",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "consideration": [],
    "purchase": [],
    "delivery_unboxing": [],
    "usage": [],
    "post_purchase": [],
    "journey_table": {
      "awareness": {
        "customer_actions": "What customers do at this stage (e.g., searching online, browsing social media)",
        "touchpoints": "Where interactions happen (e.g., Instagram, Facebook, Google)",
        "emotions": "How customers feel (e.g., curious, interested, skeptical)",
        "pain_points": "Challenges faced (e.g., hard to find information, unclear product benefits)",
        "opportunities": "How to improve (e.g., better SEO, clearer messaging)"
      },
      "consideration": {
        "customer_actions": "Actions during research phase",
        "touchpoints": "Research channels and platforms",
        "emotions": "Feelings during evaluation",
        "pain_points": "Decision-making obstacles",
        "opportunities": "Ways to facilitate choice"
      },
      "purchase": {
        "customer_actions": "Buying process activities",
        "touchpoints": "Purchase channels",
        "emotions": "Purchase experience feelings",
        "pain_points": "Transaction friction",
        "opportunities": "Checkout improvements"
      },
      "delivery_unboxing": {
        "customer_actions": "Receiving and opening actions",
        "touchpoints": "Delivery and packaging touchpoints",
        "emotions": "First impression feelings",
        "pain_points": "Delivery or packaging issues",
        "opportunities": "Unboxing experience enhancements"
      },
      "usage": {
        "customer_actions": "Product usage behaviors",
        "touchpoints": "Product interaction points",
        "emotions": "Usage satisfaction levels",
        "pain_points": "Product experience issues",
        "opportunities": "Usage improvements"
      },
      "post_purchase": {
        "customer_actions": "Post-purchase behaviors",
        "touchpoints": "Support and community channels",
        "emotions": "Long-term satisfaction",
        "pain_points": "Support or loyalty issues",
        "opportunities": "Retention strategies"
      }
    }
  }
}`,

      strategic_recommendations: `${basePrompt}

You are now acting as a Strategic Synthesis Expert. Your task is to analyze ALL the insights from previous analyses and develop comprehensive strategic recommendations.

CRITICAL: DO NOT re-analyze raw reviews. Instead, synthesize the insights already extracted from:
- Product Description Analysis
- Sentiment Analysis (likes/dislikes with percentages)
- Voice of Customer (keyword frequencies)
- Rating Analysis (what drives each rating level)
- 4W Matrix (who/what/where/when patterns)
- Jobs to be Done (functional/emotional/social jobs)
- STP Analysis (segments, targeting, positioning)
- SWOT Analysis (strengths, weaknesses, opportunities, threats)
- Customer Journey (touchpoints and friction points)
- Smart Competition Analysis (if available)

Your recommendations MUST:
1. Cross-reference insights from multiple analyses to identify patterns
2. Connect related findings across different analyses
3. Prioritize based on frequency and impact across analyses
4. Ensure consistency with all previous findings
5. Focus on actionable strategies that address multiple insights
6. Distinguish between quick wins and long-term initiatives
7. Consider competitive positioning in recommendations
8. Reference specific data points from the analyses (percentages, segments, etc.)

Response format:
{
  "strategic_recommendations": {
    "executive_summary": "Concise overview",
    "product_strategy": [
      {
        "recommendation": "Recommendation text",
        "priority_level": "High|Medium|Low",
        "timeframe": "Short-term|Medium-term|Long-term",
        "introduction": "Brief introduction",
        "supporting_evidence": "Evidence",
        "expected_impact": "Impact",
        "implementation_considerations": "Considerations"
      }
    ],
    "marketing_strategy": [],
    "customer_experience": [],
    "competitive_strategy": []
  }
}`,

      rating_analysis: `You are a Customer Insight Analyst with over 10 years of experience in analyzing customer feedback.

You are highly skilled in:
- Identifying themes in review datasets
- Extracting what customers like (value drivers) and dislike (friction points)
- Identifying customer satisfaction based on product reviews

Your job is:
- Analyze reviews by rating distribution to identify what drives each rating level. Focus on themes that correlate with specific ratings based on frequency in reviews. Consider up to ten themes/topics most frequently mentioned in the reviews.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "rating_analysis": {
    "ratings": [
      {
        "rating": 5,
        "count": 0,
        "top_themes": [
          {
            "theme": "Theme name",
            "frequency": "XX%"
          }
        ]
      },
      {
        "rating": 4,
        "count": 0,
        "top_themes": []
      },
      {
        "rating": 3,
        "count": 0,
        "top_themes": []
      },
      {
        "rating": 2,
        "count": 0,
        "top_themes": []
      },
      {
        "rating": 1,
        "count": 0,
        "top_themes": []
      }
    ],
    "insights": {
      "highest_rated_aspects": ["Aspect 1", "Aspect 2"],
      "lowest_rated_aspects": ["Aspect 1", "Aspect 2"],
      "summary": "Brief summary of what drives ratings"
    }
  }
}`,

      smart_competition: `You are a Strategic Business Intelligence Analyst with over 15 years of experience in competitive analysis and market positioning. You specialize in transforming customer review data into actionable competitive strategies.

You are highly skilled in:
- Comparative analysis across multiple brands using structured data
- Identifying strategic opportunities and threats through customer feedback
- Creating differentiation frameworks and competitive positioning strategies
- Strategic recommendation generation based on competitive intelligence

Your job is to:
Conduct a comprehensive Smart Competition Analysis by comparing your product's analyses with detailed competitor analyses across 4 key dimensions:

1. PRODUCT ATTRIBUTES COMPARISON
Compare ALL product attributes from your product description with ALL attributes from each competitor's product description, considering the following:
- Merge related attributes to avoid duplication/overlapping
- Calculate Differentiation Scores: Before calculating Differentiation Scores for an attribute, you must identify the nature of the attribute, if it represents a positive theme or negative theme.
Then provide Differentiation Scores:
For positive theme attributes: 1 = only you have it, 0 = everyone has it, -1 = only competitor(s) have it
For negative theme attributes: -1 = only you have it, 0 = everyone has it, 1 = only competitor(s) have it
- Use ONLY the actual competitor names from the provided data - do NOT create fake competitors
- If only one competitor is provided, only include that one competitor in the analysis
- Provide detailed explanations for each attribute and why it matters

2. STRENGTHS & WEAKNESSES MATRIX
- Compare your SWOT analysis with each competitor's Strengths and Weaknesses
- Derive Opportunities: Where competitors are weak but you are strong
- Derive Threats: Where competitors are strong but you are weak
- Identify shared industry challenges and unique advantages
- Provide detailed explanations for each strength, weakness, opportunity, and threat

3. CUSTOMER SEGMENTATION OVERLAP
- Compare your STP segments with each competitor's segments
- Calculate overlap based on similar customer demographics and behaviors
- Identify segments that no one is targeting effectively
- Look for positioning opportunities in underserved segments
- Provide detailed explanations for each segment analysis and strategic implications

4. CUSTOMER JOURNEY FRICTION ANALYSIS
- Compare journey stages between you and competitors
- Calculate friction scores based on pain points and issues mentioned
- Lower score = better experience, Higher score = more friction
- Identify where each brand excels or struggles
- Provide detailed explanations for each journey stage and strategic recommendations
CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "smart_competition_analysis": {
    "product_attributes": {
      "attribute_comparison": [
        {
          "attribute": "Feature name",
          "explanation": "Detailed explanation of this attribute and why it matters to customers",
          "you_have": true,
          "competitors": {
            "[Use actual competitor names from data]": true
          },
          "differentiation_score": 0.5,
          "strategic_value": "high|medium|low",
        }
      ],
      "unique_advantages": [{"advantage": "Advantage name", "explanation": "Why this gives you competitive edge"}],
      "feature_gaps": [{"gap": "Missing feature name", "explanation": "Why this gap matters and impact"}],
      "strategic_recommendations": [{"recommendation": "Action item", "explanation": "Why this recommendation matters"}]
    },
    "swot_matrix": {
      "strength_comparison": {
        "your_strengths": [{"strength": "Strength name", "explanation": "Why this is a strength"}],
        "competitor_strengths": {
          "[Use actual competitor names]": [{"strength": "Their strength", "explanation": "Why this is their strength"}]
        },
        "competitive_advantages": [{"advantage": "Where you win", "explanation": "Why this advantage matters"}],
        "strength_gaps": [{"gap": "Where they win", "explanation": "Why this gap matters"}]
      },
      "weakness_comparison": {
        "your_weaknesses": [{"weakness": "Weakness name", "explanation": "Why this is a weakness"}],
        "competitor_weaknesses": {
          "[Use actual competitor names]": [{"weakness": "Their weakness", "explanation": "Why this is their weakness"}]
        },
        "shared_weaknesses": [{"weakness": "Common issue", "explanation": "Why this affects everyone"}],
        "relative_advantages": [{"advantage": "Their weakness you avoid", "explanation": "Why this gives you advantage"}]
      },
      "derived_opportunities": [{"opportunity": "Strategic opportunity", "explanation": "How to capitalize on this"}],
      "derived_threats": [{"threat": "Strategic threat", "explanation": "How this could impact you"}]
    },
    "segmentation_analysis": {
      "your_primary_segments": [{"segment": "Segment name (XX%)", "explanation": "Why this is your key segment"}],
      "competitor_segments": {
        "[Use actual competitor names]": [{"segment": "Their segment (XX%)", "explanation": "Why this is their key segment"}]
      },
      "overlap_analysis": {
        "[Use actual competitor names]": {"overlap_score": 25, "shared_segments": ["Segment names"], "explanation": "Analysis of overlap and implications"}
      },
      "untapped_segments": [{"segment": "Segment nobody targets", "explanation": "Why this segment is opportunity"}],
      "positioning_opportunity": "Strategic positioning insight with detailed explanation",
      "segment_recommendations": [{"recommendation": "Target this segment", "explanation": "Why this strategy will work"}]
    },
    "journey_analysis": {
      "awareness": {
        "your_friction_score": 7.2,
        "competitor_scores": {
          "[Use actual competitor names]": 3.1
        },
        "winner": "[competitor name or 'you']",
        "gap_analysis": "Detailed explanation of what they do better/worse",
        "improvement_opportunity": "Specific action items for improvement"
      },
      "purchase": {
        "your_friction_score": 2.1,
        "competitor_scores": {
          "[Use actual competitor names]": 5.8
        },
        "winner": "you",
        "gap_analysis": "Detailed explanation of what you do better",
        "competitive_advantage": "Why this advantage matters strategically"
      },
      "post_purchase": {
        "your_friction_score": 1.2,
        "competitor_scores": {
          "[Use actual competitor names]": 8.9
        },
        "winner": "you",
        "gap_analysis": "Detailed explanation of what you do better",
        "competitive_advantage": "Why this advantage matters strategically"
      },
      "strategic_focus": "Primary area needing improvement with detailed explanation",
      "journey_recommendations": [{"recommendation": "Tactical action", "explanation": "Why this will improve journey"}]
    },
    "executive_summary": {
      "competitive_position": "Overall market position vs competitors",
      "key_advantages": ["Top 3 advantages you have"],
      "key_vulnerabilities": ["Top 3 areas you're weak"],
      "strategic_priorities": ["Priority 1", "Priority 2", "Priority 3"],
      "market_opportunity": "Biggest untapped opportunity"
    }
  }
}`,
    };

    return (
      specificPrompts[analysisType as keyof typeof specificPrompts] ||
      basePrompt
    );
  }

  private buildUserPrompt(
    analysisType: string,
    reviews: ReviewMetadata[],
    competitorReviews?: ReviewMetadata[],
    existingAnalyses?: Record<string, any>,
    productVariations?: Record<string, { count: number; description?: string }>,
  ): string {
    // Special handling for smart competition analysis
    if (
      analysisType === "smart_competition" &&
      existingAnalyses &&
      existingAnalyses.competitorAnalyses
    ) {
      return this.buildSmartCompetitionPrompt(
        existingAnalyses,
        competitorReviews || [], // Pass empty array if no competitor reviews
      );
    }

    // Special handling for strategic recommendations - use existing analyses instead of reviews
    if (
      analysisType === "strategic_recommendations" &&
      existingAnalyses &&
      Object.keys(existingAnalyses).length > 0
    ) {
      return this.buildStrategicRecommendationsPrompt(existingAnalyses);
    }

    let prompt = `Analyze the following customer reviews for ${analysisType} analysis:\n\n`;

    // Add product variations context if available
    if (productVariations && Object.keys(productVariations).length > 0) {
      prompt += `IMPORTANT: This product has multiple variations:\n`;
      Object.entries(productVariations).forEach(([variation, info]) => {
        prompt += `- ${variation}: ${info.count} reviews`;
        if (info.description) {
          prompt += ` (${info.description})`;
        }
        prompt += `\n`;
      });
      prompt += `\nPlease consider these variations in your analysis and provide variation-specific insights where relevant.\n\n`;
    }

    // Add main product reviews
    prompt += `MAIN PRODUCT REVIEWS (${reviews.length} reviews):\n`;
    reviews.forEach((review, index) => {
      prompt += `Review ${index + 1}:\n`;
      prompt += `Rating: ${review.rating || "N/A"}\n`;
      prompt += `Date: ${review.date || "N/A"}\n`;
      prompt += `Text: ${review.text}\n\n`;
    });

    // Add competitor reviews if available
    if (competitorReviews && competitorReviews.length > 0) {
      prompt += `\nCOMPETITOR REVIEWS (${competitorReviews.length} reviews):\n`;
      competitorReviews.forEach((review, index) => {
        prompt += `Competitor Review ${index + 1}:\n`;
        prompt += `Competitor ID: ${review.competitorId}\n`;
        prompt += `Rating: ${review.rating || "N/A"}\n`;
        prompt += `Text: ${review.text}\n\n`;
      });
    }

    prompt += `\nPerform the ${analysisType} analysis based on these reviews. Ensure all percentages are realistic and based on the actual review content provided.`;

    return prompt;
  }

  private buildStrategicRecommendationsPrompt(
    existingAnalyses: Record<string, any>,
  ): string {
    let prompt = `Based on the comprehensive analyses already performed, develop strategic recommendations that synthesize all insights.\n\n`;

    prompt += `IMPORTANT: You are synthesizing insights already extracted from customer reviews. DO NOT re-analyze raw data. Instead, identify patterns, connections, and priorities across all analyses to create cohesive strategic recommendations.\n\n`;

    prompt += `AVAILABLE ANALYSIS INSIGHTS:\n\n`;

    // Include product variations if available
    if (
      existingAnalyses.productVariations &&
      Object.keys(existingAnalyses.productVariations).length > 0
    ) {
      prompt += `PRODUCT VARIATIONS:\n`;
      prompt += `This product has the following variations that should be considered in recommendations:\n`;
      Object.entries(existingAnalyses.productVariations).forEach(
        ([variation, info]: [string, any]) => {
          prompt += `- ${variation}: ${info.count} reviews`;
          if (info.description) {
            prompt += ` (${info.description})`;
          }
          prompt += `\n`;
        },
      );
      prompt += `\n\n`;
    }

    // Include all relevant analyses
    if (existingAnalyses.product_description) {
      prompt += `1. PRODUCT DESCRIPTION ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.product_description, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.sentiment) {
      prompt += `2. SENTIMENT ANALYSIS (What Customers Like/Dislike):\n`;
      prompt += JSON.stringify(existingAnalyses.sentiment, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.voice_of_customer) {
      prompt += `3. VOICE OF CUSTOMER (Most Frequent Keywords):\n`;
      prompt += JSON.stringify(existingAnalyses.voice_of_customer, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.rating_analysis) {
      prompt += `4. RATING ANALYSIS (What Drives Each Rating Level):\n`;
      prompt += JSON.stringify(existingAnalyses.rating_analysis, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.four_w_matrix) {
      prompt += `5. FOUR W MATRIX (Who/What/Where/When):\n`;
      prompt += JSON.stringify(existingAnalyses.four_w_matrix, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.jtbd) {
      prompt += `6. JOBS TO BE DONE ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.jtbd, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.stp) {
      prompt += `7. STP ANALYSIS (Segmentation, Targeting, Positioning):\n`;
      prompt += JSON.stringify(existingAnalyses.stp, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.swot) {
      prompt += `8. SWOT ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.swot, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.customer_journey) {
      prompt += `9. CUSTOMER JOURNEY ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.customer_journey, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.smart_competition) {
      prompt += `10. SMART COMPETITION ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.smart_competition, null, 2);
      prompt += `\n\n`;
    }

    prompt += `\nSYNTHESIS INSTRUCTIONS:
1. Cross-reference insights from multiple analyses to identify recurring themes
2. Look for connections between different findings (e.g., a weakness in SWOT that appears as pain point in sentiment)
3. Prioritize recommendations based on:
   - Frequency across analyses (issues mentioned in multiple analyses)
   - Impact severity (major weaknesses and frequent issues)
   - Customer volume affected (percentage of customers mentioning issue)
4. Ensure all recommendations are consistent with the analyses provided
5. Focus on actionable strategies that address multiple insights simultaneously
6. Consider quick wins vs. long-term strategic initiatives
7. Account for competitive positioning when making recommendations
8. Consider product variations - if issues or opportunities are specific to certain variations, make variation-specific recommendations

Generate comprehensive strategic recommendations based on this synthesis.`;

    return prompt;
  }

  private buildSmartCompetitionPrompt(
    existingAnalyses: Record<string, any>,
    competitorReviews: ReviewMetadata[],
  ): string {
    let prompt = `Conduct a Smart Competition Analysis by comparing specific analysis dimensions. CRITICAL: You MUST use ONLY the designated data for each comparison dimension as specified below.\n\n`;

    // Section 1: Product Variations (for context across all dimensions)
    prompt += `=== PRODUCT VARIATIONS (for contextual reference only) ===\n\n`;

    // Add main product variations if available
    if (
      existingAnalyses.productVariations &&
      Object.keys(existingAnalyses.productVariations).length > 0
    ) {
      prompt += `YOUR PRODUCT VARIATIONS:\n`;
      Object.entries(existingAnalyses.productVariations).forEach(
        ([variation, info]: [string, any]) => {
          prompt += `- ${variation}: ${info.count} reviews`;
          if (info.description) {
            prompt += ` (${info.description})`;
          }
          prompt += `\n`;
        },
      );
      prompt += `\n`;
    }

    // Add competitor variations
    if (existingAnalyses.competitorAnalyses) {
      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        if (
          competitorData.variations &&
          Object.keys(competitorData.variations).length > 0
        ) {
          prompt += `${competitorData.name} VARIATIONS:\n`;
          Object.entries(competitorData.variations).forEach(
            ([variation, info]: [string, any]) => {
              prompt += `- ${variation}: ${info.count} reviews`;
              if (info.description) {
                prompt += ` (${info.description})`;
              }
              prompt += `\n`;
            },
          );
          prompt += `\n`;
        }
      }
    }

    // Section 2: Product Attributes Data (ONLY for Product Attributes Comparison)
    prompt += `\n=== SECTION 1: PRODUCT DESCRIPTION DATA (USE ONLY FOR PRODUCT ATTRIBUTES COMPARISON) ===\n\n`;

    if (existingAnalyses.product_description) {
      prompt += `YOUR PRODUCT DESCRIPTION:\n`;
      prompt += JSON.stringify(existingAnalyses.product_description, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.competitorAnalyses) {
      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        if (competitorData.product_description) {
          prompt += `${competitorData.name} PRODUCT DESCRIPTION:\n`;
          prompt += JSON.stringify(competitorData.product_description, null, 2);
          prompt += `\n\n`;
        }
      }
    }

    // Section 3: SWOT Data (ONLY for SWOT Matrix Comparison)
    prompt += `\n=== SECTION 2: SWOT DATA (USE ONLY FOR SWOT MATRIX COMPARISON) ===\n\n`;

    if (existingAnalyses.swot) {
      prompt += `YOUR SWOT ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.swot, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.competitorAnalyses) {
      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        if (competitorData.swot) {
          prompt += `${competitorData.name} SWOT (Strengths & Weaknesses only):\n`;
          prompt += JSON.stringify(competitorData.swot, null, 2);
          prompt += `\n\n`;
        }
      }
    }

    // Section 4: STP Data (ONLY for Customer Segmentation Analysis)
    prompt += `\n=== SECTION 3: STP DATA (USE ONLY FOR CUSTOMER SEGMENTATION ANALYSIS) ===\n\n`;

    if (existingAnalyses.stp) {
      prompt += `YOUR STP ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.stp, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.competitorAnalyses) {
      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        if (competitorData.stp) {
          prompt += `${competitorData.name} STP ANALYSIS:\n`;
          prompt += JSON.stringify(competitorData.stp, null, 2);
          prompt += `\n\n`;
        }
      }
    }

    // Section 5: Customer Journey Data (ONLY for Journey Friction Analysis)
    prompt += `\n=== SECTION 4: CUSTOMER JOURNEY DATA (USE ONLY FOR JOURNEY FRICTION ANALYSIS) ===\n\n`;

    if (existingAnalyses.customer_journey) {
      prompt += `YOUR CUSTOMER JOURNEY:\n`;
      prompt += JSON.stringify(existingAnalyses.customer_journey, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.competitorAnalyses) {
      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        if (competitorData.customer_journey) {
          prompt += `${competitorData.name} CUSTOMER JOURNEY:\n`;
          prompt += JSON.stringify(competitorData.customer_journey, null, 2);
          prompt += `\n\n`;
        }
      }
    }

    // List all competitor names for the AI to use
    const competitorNames = Object.keys(
      existingAnalyses.competitorAnalyses || {},
    );
    const competitorNamesList = competitorNames.map((id) => {
      const competitor = existingAnalyses.competitorAnalyses[id];
      return competitor.name || id;
    });

    console.log(
      `🎯 Smart Competition Analysis - Found ${competitorNames.length} competitors:`,
      competitorNamesList,
    );
    console.log(
      `📊 Competitor analyses keys:`,
      Object.keys(existingAnalyses.competitorAnalyses || {}),
    );

    if (competitorNamesList.length === 0) {
      console.log(
        `⚠️ WARNING: No competitor names found for Smart Competition Analysis!`,
      );
    }

    prompt += `\nIMPORTANT: Use ONLY these competitor names in your response: ${competitorNamesList.join(", ")}
    DO NOT create fake competitors like "Competitor A" or "Competitor B".
    If no competitor names are provided, respond with an error message.

    CRITICAL DATA ISOLATION RULES:
    You MUST follow these strict data isolation rules for each analysis dimension:

    1. PRODUCT ATTRIBUTES COMPARISON:
       - USE ONLY: Data from SECTION 1 (Product Description Data)
       - DO NOT USE: Any data from SWOT, STP, or Customer Journey sections
       - Focus on: Comparing attributes, features, and specifications listed in product descriptions
       - Consider variations when comparing attributes

    2. SWOT MATRIX COMPARISON:
       - USE ONLY: Data from SECTION 2 (SWOT Data)
       - DO NOT USE: Any data from Product Description, STP, or Customer Journey sections
       - Focus on: Comparing strengths, weaknesses, and deriving opportunities/threats

    3. CUSTOMER SEGMENTATION ANALYSIS:
       - USE ONLY: Data from SECTION 3 (STP Data)
       - DO NOT USE: Any data from Product Description, SWOT, or Customer Journey sections
       - Focus on: Comparing target segments, positioning, and overlap analysis

    4. CUSTOMER JOURNEY FRICTION ANALYSIS:
       - USE ONLY: Data from SECTION 4 (Customer Journey Data)
       - DO NOT USE: Any data from Product Description, SWOT, or STP sections
       - Focus on: Comparing friction points across journey stages

    Based on this isolated data, perform a Smart Competition Analysis following these specific guidelines:

1. For Product Attributes (USE SECTION 1 ONLY): Compare all attributes found in your product description AND all attributes found in each competitor's product description. Look for features mentioned in competitor descriptions that might not be in your product.

2. For SWOT Matrix (USE SECTION 2 ONLY): Compare your SWOT with each competitor's Strengths and Weaknesses. Derive Opportunities from where competitors are weak but you are strong. Derive Threats from where competitors are strong but you are weak.

3. For Segmentation (USE SECTION 3 ONLY): Compare your customer segments with each competitor's segments. Look for overlaps and gaps in targeting. Base overlap calculations ONLY on the segmentation data provided.

4. For Customer Journey (USE SECTION 4 ONLY): Compare friction points at each stage of the journey between you and competitors. Score friction based ONLY on the journey data provided, not on any other analysis.

REMEMBER: Each dimension MUST be analyzed using ONLY its designated section. Cross-contamination of data between sections will result in invalid analysis. Focus on strategic intelligence and actionable insights with detailed explanations based on the isolated data.`;

    return prompt;
  }

  private async enhanceWithTemporalAnalysis(
    analysisType: string,
    initialData: any,
    productId: string,
    userId: string,
    brandId: string,
  ): Promise<any> {
    try {
      // Import pinecone service dynamically to avoid circular imports
      const { pineconeService } = await import("./pinecone");

      // Extract topics from the initial analysis based on analysis type
      const topics = this.extractTopicsFromAnalysis(analysisType, initialData);

      if (topics.length === 0) {
        console.log(`No topics found for temporal analysis in ${analysisType}`);
        return { data: initialData, apiCalls: 0 };
      }

      console.log(
        `Found ${topics.length} topics for temporal analysis in ${analysisType}`,
      );

      // BACK TO ORIGINAL: Retrieve ALL product reviews once instead of multiple searches
      console.log(`Retrieving ALL product reviews for temporal analysis...`);

      const allReviews = await pineconeService.getAllProductReviews(
        productId,
        userId,
        brandId,
        1000, // Increased to 1000 reviews for more comprehensive temporal analysis
      );

      console.log(
        `Retrieved ${allReviews.length} total reviews for temporal analysis`,
      );

      if (allReviews.length === 0) {
        console.log(`No reviews found for temporal analysis`);
        return { data: initialData, apiCalls: 0 };
      }

      // Analyze all topics in a single API call
      const temporalTrends = await this.analyzeAllTopicsTemporalTrends(
        topics.map((t) => t.name),
        allReviews,
        analysisType,
      );

      // Update all topics with their temporal data
      if (temporalTrends) {
        topics.forEach((topic) => {
          const trend = temporalTrends[topic.name];
          if (trend) {
            this.updateTopicWithTemporalData(
              analysisType,
              initialData,
              topic.path,
              trend,
            );
          }
        });
      }

      console.log(
        `⚡ Completed temporal analysis with 1 API call (optimized from ${topics.length} calls)`,
      );
      return { data: initialData, apiCalls: 1 };
    } catch (error) {
      console.error("Error in temporal enhancement:", error);
      // Return original data if temporal enhancement fails
      return { data: initialData, apiCalls: 0 };
    }
  }

  private extractTopicsFromAnalysis(
    analysisType: string,
    data: any,
  ): Array<{ name: string; path: string[] }> {
    const topics: Array<{ name: string; path: string[] }> = [];

    switch (analysisType) {
      case "sentiment":
        // Extract from customer_likes and customer_dislikes
        if (data.sentiment_analysis?.customer_likes) {
          data.sentiment_analysis.customer_likes.forEach(
            (item: any, index: number) => {
              if (item.theme) {
                topics.push({
                  name: item.theme,
                  path: [
                    "sentiment_analysis",
                    "customer_likes",
                    index.toString(),
                  ],
                });
              }
            },
          );
        }
        if (data.sentiment_analysis?.customer_dislikes) {
          data.sentiment_analysis.customer_dislikes.forEach(
            (item: any, index: number) => {
              if (item.theme) {
                topics.push({
                  name: item.theme,
                  path: [
                    "sentiment_analysis",
                    "customer_dislikes",
                    index.toString(),
                  ],
                });
              }
            },
          );
        }
        break;

      case "rating_analysis":
        // Extract themes from each rating level
        if (data.rating_analysis?.ratings) {
          data.rating_analysis.ratings.forEach(
            (rating: any, rIndex: number) => {
              if (rating.top_themes) {
                rating.top_themes.forEach((theme: any, tIndex: number) => {
                  if (theme.theme) {
                    topics.push({
                      name: theme.theme,
                      path: [
                        "rating_analysis",
                        "ratings",
                        rIndex.toString(),
                        "top_themes",
                        tIndex.toString(),
                      ],
                    });
                  }
                });
              }
            },
          );
        }
        break;

      case "swot":
        // Extract from all SWOT categories
        const swotCategories = [
          "strengths",
          "weaknesses",
          "opportunities",
          "threats",
        ];
        swotCategories.forEach((category) => {
          if (data.swot_analysis?.[category]) {
            data.swot_analysis[category].forEach((item: any, index: number) => {
              if (item.topic) {
                topics.push({
                  name: item.topic,
                  path: ["swot_analysis", category, index.toString()],
                });
              }
            });
          }
        });
        break;

      case "four_w_matrix":
        // Extract from who, what, where, when
        const fourWCategories = ["who", "what", "where", "when"];
        fourWCategories.forEach((category) => {
          if (data.four_w_matrix?.[category]) {
            data.four_w_matrix[category].forEach((item: any, index: number) => {
              if (item.topic) {
                topics.push({
                  name: item.topic,
                  path: ["four_w_matrix", category, index.toString()],
                });
              }
            });
          }
        });
        break;

      case "jtbd":
        // Extract from functional, emotional, social jobs
        const jobTypes = ["functional_jobs", "emotional_jobs", "social_jobs"];
        jobTypes.forEach((jobType) => {
          if (data.jtbd_analysis?.[jobType]) {
            data.jtbd_analysis[jobType].forEach((job: any, index: number) => {
              // Use job name if available (new format), fallback to job_statement (old format)
              const topicName = job.job || job.job_statement;
              if (topicName) {
                topics.push({
                  name: topicName,
                  path: ["jtbd_analysis", jobType, index.toString()],
                });
              }
            });
          }
        });
        break;

      case "customer_journey":
        // Extract topics from each stage
        const journeyStages = [
          "awareness",
          "consideration",
          "purchase",
          "delivery_unboxing",
          "usage",
          "post_purchase",
        ];
        journeyStages.forEach((stage) => {
          if (
            data.customer_journey?.[stage] &&
            Array.isArray(data.customer_journey[stage])
          ) {
            data.customer_journey[stage].forEach((item: any, index: number) => {
              if (item.topic) {
                topics.push({
                  name: item.topic,
                  path: ["customer_journey", stage, index.toString()],
                });
              }
            });
          }
        });
        break;

      case "stp":
        // Extract segments
        if (data.stp_analysis?.segmentation) {
          data.stp_analysis.segmentation.forEach(
            (segment: any, index: number) => {
              if (segment.segment) {
                topics.push({
                  name: segment.segment,
                  path: ["stp_analysis", "segmentation", index.toString()],
                });
              }
            },
          );
        }
        break;
    }

    return topics;
  }

  // New method for Option 1: Analyze topics with pre-organized reviews
  private async analyzeTopicsWithOrganizedReviews(
    topicReviewsMap: Record<string, ReviewMetadata[]>,
    analysisType?: string,
  ): Promise<Record<string, any>> {
    try {
      // Get current date for context
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

      // Build prompt with organized reviews by topic
      let prompt = `Current Date: ${currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} (${currentYear}-Q${currentQuarter})\n\n`;
      prompt += `You will analyze temporal trends for multiple topics. Each topic has its own set of relevant reviews already filtered for you.\n\n`;

      prompt += `TOPIC-SPECIFIC REVIEWS:\n\n`;

      // Add reviews organized by topic
      Object.entries(topicReviewsMap).forEach(([topicName, reviews]) => {
        prompt += `═══════════════════════════════════════\n`;
        prompt += `TOPIC: "${topicName}"\n`;
        prompt += `Total Reviews: ${reviews.length}\n`;
        prompt += `═══════════════════════════════════════\n\n`;

        if (reviews.length === 0) {
          prompt += `No reviews found for this topic.\n\n`;
        } else {
          // Group reviews by time period for this topic
          const timeGroups = this.groupReviewsByTimePeriod(reviews);

          Object.entries(timeGroups).forEach(([period, periodReviews]) => {
            prompt += `${period} (${periodReviews.length} reviews):\n`;
            periodReviews.forEach((review, index) => {
              prompt += `  Review ${index + 1}:\n`;
              prompt += `    Rating: ${review.rating || "N/A"}\n`;
              prompt += `    Date: ${review.date || "N/A"}\n`;
              // Truncate very long reviews to keep prompt manageable
              const reviewText =
                review.text.length > 150
                  ? review.text.substring(0, 150) + "..."
                  : review.text;
              prompt += `    Text: ${reviewText}\n\n`;
            });
          });
        }
      });

      prompt += `\nINSTRUCTIONS:
For EACH topic above:
1. The reviews shown are ALREADY filtered for that specific topic
2. Analyze the temporal pattern based on the frequency and sentiment across time periods
3. Determine the temporal status:
   - RESOLVED: Topic was present but hasn't been mentioned in over 6 months
   - CURRENT: Topic is actively being mentioned in recent reviews (within 3 months)
   - IMPROVING: Frequency/severity of mentions is decreasing over time
   - DECLINING: Frequency/severity of mentions is increasing over time
   - EMERGING: New topic that appeared recently (within last 6 months) after not being present before
   - STABLE: Consistent mentions over time with no significant change
   - NOT_FOUND: No reviews found for this topic
4. Create a timeline showing frequency per period
5. Note when the topic was last mentioned (if resolved)
6. Provide a brief summary of how the topic has evolved

Return a JSON object with this structure for ALL topics:
{
  "topic_name_1": {
    "status": "RESOLVED|CURRENT|IMPROVING|DECLINING|EMERGING|STABLE|NOT_FOUND",
    "timeline": [
      {"period": "year-quarter", "frequency": number}
    ],
    "last_mentioned": "date string or null",
    "trend_summary": "Brief description of evolution"
  },
  "topic_name_2": {
    ...same structure...
  }
}`;

      // Check prompt size
      const promptSize = prompt.length;
      console.log(
        `📊 Temporal analysis prompt size: ${promptSize.toLocaleString()} characters`,
      );

      console.log(`🤖 Sending organized temporal analysis to OpenAI...`);

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a temporal trend analyst. Each topic has been pre-filtered with relevant reviews. Analyze the temporal pattern for each topic based on the provided reviews. Today's date is ${currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Respond with valid JSON only.`,
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
        reasoning_effort: "medium",
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error(`❌ OpenAI returned empty content`);
        throw new Error("No response from temporal analysis");
      }

      console.log(`✅ ${completion.model} temporal analysis completed`);

      // Parse and validate response
      const parsedResponse = JSON.parse(content);
      const returnedTopicCount = Object.keys(parsedResponse).length;
      console.log(`\n🤖 Temporal Response Validation:`);
      console.log(`   - Requested ${topicNames.length} topics`);
      console.log(`   - Received ${returnedTopicCount} topics`);

      if (returnedTopicCount < topicNames.length) {
        const missingTopics = topicNames.filter((t) => !parsedResponse[t]);
        console.warn(
          `   ⚠️ Missing ${missingTopics.length} topics in temporal response:`,
        );
        console.log(
          `   - Missing: ${missingTopics.slice(0, 5).join(", ")}${missingTopics.length > 5 ? "..." : ""}`,
        );
      }

      // Log token usage
      const usage = completion.usage;
      if (usage) {
        console.log(
          `📊 TEMPORAL TOKEN USAGE: ${usage.total_tokens.toLocaleString()} total`,
        );

        if (analysisType && this.analysisTokenUsage.has(analysisType)) {
          const currentUsage = this.analysisTokenUsage.get(analysisType)!;
          currentUsage.prompt_tokens += usage.prompt_tokens;
          currentUsage.completion_tokens += usage.completion_tokens;
          currentUsage.total_tokens += usage.total_tokens;
          currentUsage.cost += 0;
        }
      }

      return parsedResponse;
    } catch (error) {
      console.error(`Error in organized temporal analysis:`, error);
      return {};
    }
  }

  // Keep old method but deprecated
  private async analyzeAllTopicsTemporalTrends(
    topicNames: string[],
    allReviews: ReviewMetadata[],
    analysisType?: string,
  ): Promise<Record<string, any>> {
    try {
      // Estimate prompt size and decide on batching strategy
      const estimatedSize = this.estimatePromptSize(topicNames, allReviews);
      console.log(
        `📏 Estimated prompt size: ${estimatedSize.toLocaleString()} characters`,
      );

      // If prompt is too large, fall back to batching
      if (estimatedSize > 150000) {
        console.log(`⚠️ Prompt too large, falling back to batching strategy`);
        return await this.analyzeTopicsInBatches(
          topicNames,
          allReviews,
          analysisType,
        );
      }

      // Proceed with single API call
      return await this.analyzeSingleBatchTemporalTrends(
        topicNames,
        allReviews,
        analysisType,
      );
    } catch (error) {
      console.error(`Error analyzing temporal trends for topics:`, error);
      return {};
    }
  }

  private estimatePromptSize(
    topicNames: string[],
    allReviews: ReviewMetadata[],
  ): number {
    // Rough estimation: base prompt + topics + reviews
    const basePromptSize = 2000;
    const topicsSize = topicNames.length * 50; // ~50 chars per topic
    const reviewsSize = allReviews.reduce(
      (sum, review) => sum + (review.text?.length || 0) + 100,
      0,
    ); // text + metadata
    return basePromptSize + topicsSize + reviewsSize;
  }

  private async analyzeTopicsInBatches(
    topicNames: string[],
    allReviews: ReviewMetadata[],
    analysisType?: string,
  ): Promise<Record<string, any>> {
    const batchSize = Math.max(5, Math.floor(topicNames.length / 3)); // 3-4 batches max
    const allResults: Record<string, any> = {};
    let totalApiCalls = 0;

    console.log(
      `🔄 Processing ${topicNames.length} topics in batches of ${batchSize}`,
    );

    for (let i = 0; i < topicNames.length; i += batchSize) {
      const batch = topicNames.slice(i, i + batchSize);
      console.log(
        `📦 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} topics`,
      );

      try {
        const batchResult = await this.analyzeSingleBatchTemporalTrends(
          batch,
          allReviews,
          analysisType,
        );

        Object.assign(allResults, batchResult);
        totalApiCalls++;
      } catch (error) {
        console.error(
          `Error in batch ${Math.floor(i / batchSize) + 1}:`,
          error,
        );
        // Continue with other batches
      }
    }

    console.log(
      `⚡ Completed temporal analysis with ${totalApiCalls} API calls (batched)`,
    );
    return allResults;
  }

  private async analyzeSingleBatchTemporalTrends(
    topicNames: string[],
    allReviews: ReviewMetadata[],
    analysisType?: string,
  ): Promise<Record<string, any>> {
    // Group all reviews by time period first
    const timeGroups = this.groupReviewsByTimePeriod(allReviews);

    // Get current date for context
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

    // Build prompt for temporal analysis
    let prompt = `Current Date: ${currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} (${currentYear}-Q${currentQuarter})\n\n`;
    prompt += `You will analyze temporal trends for multiple topics based on ALL product reviews.\n\n`;

    prompt += `TOPICS TO ANALYZE:\n`;
    topicNames.forEach((topic, index) => {
      prompt += `${index + 1}. "${topic}"\n`;
    });
    prompt += `\n`;

    // Add ALL reviews grouped by period (limit text to avoid huge prompts)
    prompt += `ALL PRODUCT REVIEWS BY TIME PERIOD:\n`;
    Object.entries(timeGroups).forEach(([period, periodReviews]) => {
      prompt += `\n${period} (${periodReviews.length} reviews):\n`;
      periodReviews.forEach((review, index) => {
        prompt += `Review ${index + 1}:\n`;
        prompt += `Rating: ${review.rating || "N/A"}\n`;
        prompt += `Date: ${review.date || "N/A"}\n`;
        // Allow longer review text for better temporal context
        const reviewText =
          review.text.length > 2000
            ? review.text.substring(0, 2000) + "..."
            : review.text;
        prompt += `Text: ${reviewText}\n\n`;
      });
    });

    prompt += `\nINSTRUCTIONS:
For EACH topic listed above:
1. Scan through ALL reviews to identify which ones mention that topic
2. Track the frequency and sentiment of mentions across time periods
3. Determine the temporal status based on the pattern:
   - RESOLVED: Topic was present but hasn't been mentioned in over 6 months
   - CURRENT: Topic is actively being mentioned in recent reviews (within 3 months)
   - IMPROVING: Frequency/severity of mentions is decreasing over time
   - DECLINING: Frequency/severity of mentions is increasing over time
   - EMERGING: New topic that appeared recently (within last 6 months) after not being present before
   - STABLE: Consistent mentions over time with no significant change
4. Create a timeline showing frequency per period
5. Note when the topic was last mentioned (if resolved)
6. Provide a brief summary of how the topic has evolved

IMPORTANT: 
- A review might mention multiple topics - count it for each relevant topic
- If a topic is not mentioned in any reviews, mark it as having status "NOT_FOUND" with empty timeline
- Base your analysis on actual mentions in the reviews, not assumptions

Return a JSON object with this structure (keep summaries under 200 characters):
{
  "topic_name_1": {
    "status": "RESOLVED|CURRENT|IMPROVING|DECLINING|EMERGING|STABLE|NOT_FOUND",
    "timeline": [
      {"period": "year-quarter", "frequency": number}  // Use year-quarter format (e.g., "2024-Q1")
    ],
    "last_mentioned": "date or null",
    "trend_summary": "Detailed trend description (max 200 chars)"
  },
  "topic_name_2": {
    ...same structure...
  }
}`;

    // Check prompt size before sending
    const promptSize = prompt.length;
    console.log(
      `📊 Temporal analysis prompt size: ${promptSize.toLocaleString()} characters`,
    );

    if (promptSize > 100000) {
      console.warn(
        `⚠️ Large prompt detected (${promptSize} chars). May hit token limits.`,
      );
    }

    console.log(
      `🤖 Sending temporal analysis request to OpenAI for ${topicNames.length} topics...`,
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a temporal trend analyst. Analyze how multiple topics evolve over time in customer reviews. Today's date is ${currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. You must scan through all provided reviews to identify mentions of each topic, then analyze the temporal pattern for each topic independently. Respond with valid JSON only.`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 15000, // Further increased to ensure completion
      reasoning_effort: "minimal", // Reduced to save tokens since we simplified the task
    });

    console.log(`✅ ${completion.model} temporal analysis response received`);
    console.log(`🔍 Response status:`, completion.choices[0]?.finish_reason);

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error(`❌ OpenAI returned empty content. Response details:`, {
        choices: completion.choices,
        finish_reason: completion.choices[0]?.finish_reason,
        usage: completion.usage,
      });
      throw new Error("No response from temporal analysis");
    }

    console.log(
      `📝 ${completion.model} response content length: ${content.length} characters`,
    );
    console.log(`🎯 First 200 chars of response:`, content.substring(0, 200));

    // Log and accumulate token usage for temporal analysis
    const usage = completion.usage;
    if (usage) {
      console.log(
        `📊 ${analysisType?.toUpperCase() || ""} TEMPORAL ANALYSIS TOKEN USAGE (${topicNames.length} topics):`,
      );
      console.log(
        `   📝 Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`,
      );
      console.log(
        `   🤖 Completion tokens: ${usage.completion_tokens.toLocaleString()}`,
      );
      console.log(`   🔢 Total tokens: ${usage.total_tokens.toLocaleString()}`);
      console.log(
        `   💡 Efficiency: Analyzed ${topicNames.length} topics in 1 API call`,
      );

      // Accumulate tokens for the parent analysis if analysisType is provided
      if (analysisType && this.analysisTokenUsage.has(analysisType)) {
        const currentUsage = this.analysisTokenUsage.get(analysisType)!;
        currentUsage.prompt_tokens += usage.prompt_tokens;
        currentUsage.completion_tokens += usage.completion_tokens;
        currentUsage.total_tokens += usage.total_tokens;
        currentUsage.cost += 0; // Keep for compatibility but set to 0
      }
    }

    return JSON.parse(content);
  }

  // Keep the old method for backwards compatibility but it won't be used
  private async analyzeTopicTemporalTrend(
    topicName: string,
    reviews: ReviewMetadata[],
    analysisType?: string,
  ): Promise<any> {
    // This method is kept for backwards compatibility but won't be called
    // The new analyzeAllTopicsTemporalTrends handles everything in one call
    console.warn(
      "analyzeTopicTemporalTrend is deprecated, use analyzeAllTopicsTemporalTrends",
    );
    return null;
  }

  private groupReviewsByTimePeriod(
    reviews: ReviewMetadata[],
  ): Record<string, ReviewMetadata[]> {
    const groups: Record<string, ReviewMetadata[]> = {};

    reviews.forEach((review) => {
      if (review.date) {
        const date = new Date(review.date);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const period = `${year}-Q${quarter}`;

        if (!groups[period]) {
          groups[period] = [];
        }
        groups[period].push(review);
      }
    });

    // Sort periods chronologically
    const sortedGroups: Record<string, ReviewMetadata[]> = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }

  private updateTopicWithTemporalData(
    analysisType: string,
    data: any,
    path: string[],
    temporalTrend: any,
  ): void {
    if (!temporalTrend) return;

    // Navigate to the topic using the path
    let current = data;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
      if (!current) return;
    }

    // Update the topic with temporal trend
    const lastKey = path[path.length - 1];
    if (current[lastKey]) {
      current[lastKey].temporal_trend = temporalTrend;
    }
  }

  async calculateActualPercentages(
    productId: string,
    userId: string,
    brandId: string,
    existingAnalyses: Record<string, any>,
  ): Promise<AnalysisResult> {
    try {
      console.log("🔢 Starting percentage calculation for all analyses...");

      // Import pinecone service dynamically
      const { pineconeService } = await import("./pinecone");
      const { prisma } = await import("../prisma");

      // Get total review count for the product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { reviewsCount: true },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const totalReviews = product.reviewsCount;
      console.log(`📊 Total reviews for product: ${totalReviews}`);

      // Get ALL reviews for the product
      const allReviews = await pineconeService.getAllProductReviews(
        productId,
        userId,
        brandId,
        totalReviews, // Get all reviews
      );

      console.log(
        `Retrieved ${allReviews.length} reviews for percentage calculation`,
      );

      // Collect all topics from all analyses
      const allTopics: Array<{
        analysisType: string;
        topic: string;
        path: string[];
      }> = [];

      // Extract topics from each analysis type
      const analysisTypesToProcess = [
        "sentiment",
        "jtbd",
        "stp",
        "swot",
        "four_w_matrix",
        "customer_journey",
      ];

      for (const type of analysisTypesToProcess) {
        if (existingAnalyses[type]) {
          const topics = this.extractTopicsFromAnalysis(
            type,
            existingAnalyses[type],
          );
          topics.forEach((topic) => {
            allTopics.push({
              analysisType: type,
              topic: topic.name,
              path: topic.path,
            });
          });
        }
      }

      console.log(`📝 Found ${allTopics.length} topics across all analyses`);

      // Log topics by analysis type for debugging
      const topicsByType: Record<string, number> = {};
      allTopics.forEach((t) => {
        topicsByType[t.analysisType] = (topicsByType[t.analysisType] || 0) + 1;
      });
      console.log(`📊 Topics breakdown by analysis type:`, topicsByType);
      console.log(
        `📋 All topics to process:`,
        allTopics.map((t) => `[${t.analysisType}] ${t.topic}`),
      );

      // Use AI to analyze all topics across all reviews in one call
      const aiPercentageResults = await this.analyzeTopicPercentagesWithAI(
        allTopics,
        allReviews,
        totalReviews,
      );

      // Update analyses with AI-calculated percentages and importance
      const topicPercentages: Record<string, number> = {};
      const missingTopics: string[] = [];
      const processedTopics: string[] = [];

      console.log(
        `\n🔍 Processing AI results for ${allTopics.length} topics...`,
      );

      // Count unique topic names to detect duplicates
      const sentTopicNames = new Set(allTopics.map((t) => t.topic));
      const receivedTopicNames = new Set(Object.keys(aiPercentageResults));

      console.log(
        `📦 AI response contains ${Object.keys(aiPercentageResults).length} topic results`,
      );
      console.log(`   - Unique topics sent: ${sentTopicNames.size}`);
      console.log(`   - Unique topics received: ${receivedTopicNames.size}`);

      if (sentTopicNames.size !== receivedTopicNames.size) {
        console.warn(
          `   ⚠️ Topic count mismatch - likely due to duplicate topic names`,
        );
      }

      // Find missing topics by analysis type
      const missingByAnalysis: Record<string, string[]> = {};
      allTopics.forEach((topicInfo) => {
        if (!aiPercentageResults[topicInfo.topic]) {
          if (!missingByAnalysis[topicInfo.analysisType]) {
            missingByAnalysis[topicInfo.analysisType] = [];
          }
          missingByAnalysis[topicInfo.analysisType].push(topicInfo.topic);
        }
      });

      if (Object.keys(missingByAnalysis).length > 0) {
        console.warn(`\n❌ Topics NOT returned by AI:`);
        Object.entries(missingByAnalysis).forEach(([analysisType, topics]) => {
          console.warn(`   - ${analysisType}: ${topics.length} missing`);
          topics.forEach((topic) => {
            console.warn(
              `     • ${topic.substring(0, 80)}${topic.length > 80 ? "..." : ""}`,
            );
          });
        });
      } else {
        console.log(`✅ AI successfully returned results for all topics!`);
      }

      for (const topicInfo of allTopics) {
        const topicKey = `${topicInfo.analysisType}_${topicInfo.topic}`;
        const aiResult = aiPercentageResults[topicInfo.topic];

        if (aiResult) {
          const percentage = aiResult.percentage;
          topicPercentages[topicKey] = percentage;
          processedTopics.push(
            `✅ [${topicInfo.analysisType}] ${topicInfo.topic}: ${percentage.toFixed(1)}%`,
          );

          // Calculate importance based on percentage
          let importance = "Low";
          if (percentage >= 15) importance = "High";
          else if (percentage >= 5) importance = "Medium";

          // Update the analysis with AI-calculated percentage and importance
          this.updateTopicPercentage(
            existingAnalyses[topicInfo.analysisType],
            topicInfo.path,
            `${percentage.toFixed(1)}%`,
          );
          this.updateTopicImportance(
            existingAnalyses[topicInfo.analysisType],
            topicInfo.path,
            importance,
          );
        } else {
          missingTopics.push(
            `❌ [${topicInfo.analysisType}] ${topicInfo.topic}`,
          );
        }
      }

      // Log detailed results
      if (processedTopics.length > 0) {
        console.log(
          `\n✅ Successfully processed ${processedTopics.length} topics:`,
        );
        processedTopics.forEach((t) => console.log(`  ${t}`));
      }

      if (missingTopics.length > 0) {
        console.log(
          `\n⚠️ MISSING: ${missingTopics.length} topics not returned by AI:`,
        );
        missingTopics.forEach((t) => console.log(`  ${t}`));
      }

      console.log(
        `✅ Calculated percentages for ${Object.keys(topicPercentages).length} topics`,
      );

      // Update all analyses in the database
      for (const type of analysisTypesToProcess) {
        if (existingAnalyses[type]) {
          await prisma.analysis.update({
            where: {
              productId_type: {
                productId,
                type,
              },
            },
            data: {
              data: existingAnalyses[type], // Update the 'data' field, not 'result'
            },
          });
        }
      }

      return {
        type: "percentage_calculation",
        data: {
          totalReviews,
          topicsProcessed: allTopics.length,
          percentages: topicPercentages,
        },
        status: "completed",
      };
    } catch (error) {
      console.error("Error calculating percentages:", error);
      return {
        type: "percentage_calculation",
        data: {},
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private updateTopicPercentage(
    data: any,
    path: string[],
    percentage: string,
  ): void {
    if (!data) return;

    // Navigate to the topic using the path
    let current = data;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
      if (!current) return;
    }

    // Update the percentage
    const lastKey = path[path.length - 1];
    if (current[lastKey]) {
      current[lastKey].percentage = percentage;
    }
  }

  private updateTopicImportance(
    data: any,
    path: string[],
    importance: string,
  ): void {
    if (!data) return;

    // Navigate to the topic using the path
    let current = data;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
      if (!current) return;
    }

    // Update the importance
    const lastKey = path[path.length - 1];
    if (current[lastKey]) {
      current[lastKey].importance = importance;
    }
  }

  private async analyzeTopicPercentagesWithAI(
    allTopics: Array<{ analysisType: string; topic: string; path: string[] }>,
    allReviews: ReviewMetadata[],
    totalReviews: number,
  ): Promise<Record<string, { percentage: number }>> {
    try {
      console.log(
        `🤖 Starting AI percentage analysis for ${allTopics.length} topics across ${totalReviews} reviews`,
      );

      // Initialize token tracking
      this.analysisTokenUsage.set("percentage_calculation", {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost: 0,
      });

      // Prepare topics list
      const topicsList = allTopics.map((t) => t.topic).join("\n- ");

      // Prepare reviews text (limit review length to manage token usage)
      const reviewsText = allReviews
        .map(
          (review, index) =>
            `Review ${index + 1}: ${review.text.substring(0, 500)}`,
        )
        .join("\n\n");

      const prompt = `You are an expert data analyst specializing in customer review analysis. Your task is to analyze ${totalReviews} customer reviews and determine what percentage of reviews discuss each specific topic.

TOPICS TO ANALYZE:
- ${topicsList}

INSTRUCTIONS:
- For each topic, read through ALL reviews and determine what percentage of reviews actually discuss that specific topic
- Use your understanding of context, synonyms, and related terms (not just keyword matching)
- A review "discusses" a topic if it meaningfully mentions, describes, or relates to that topic
- Consider variations, synonyms, and contextual mentions

REVIEWS TO ANALYZE:
${reviewsText}

CRITICAL: Respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "topic_percentages": {
    "Topic Name 1": {
      "percentage": 15.5
    },
    "Topic Name 2": {
      "percentage": 8.2
    }
  }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert data analyst specializing in customer review percentage analysis. Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8000,
        reasoning_effort: "minimal",
      });

      console.log(
        `✅ ${completion.model} percentage analysis response received`,
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI percentage analysis");
      }

      // Log token usage
      const usage = completion.usage;
      if (usage) {
        console.log(`📊 AI PERCENTAGE ANALYSIS TOKEN USAGE:`);
        console.log(
          `   📝 Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`,
        );
        console.log(
          `   🤖 Completion tokens: ${usage.completion_tokens.toLocaleString()}`,
        );
        console.log(
          `   🔢 Total tokens: ${usage.total_tokens.toLocaleString()}`,
        );

        // Accumulate tokens
        const currentUsage = this.analysisTokenUsage.get(
          "percentage_calculation",
        )!;
        currentUsage.prompt_tokens += usage.prompt_tokens;
        currentUsage.completion_tokens += usage.completion_tokens;
        currentUsage.total_tokens += usage.total_tokens;
      }

      const response = JSON.parse(content);
      const results: Record<string, { percentage: number }> = {};

      console.log(`\n🤖 AI Response Analysis:`);
      console.log(
        `   - Response has 'topic_percentages': ${!!response.topic_percentages}`,
      );

      // Convert AI response to our format
      if (response.topic_percentages) {
        const aiTopics = Object.keys(response.topic_percentages);
        console.log(`   - AI returned ${aiTopics.length} topic results`);

        // Check for truncation indicators
        if (
          content.includes("...") &&
          content.lastIndexOf("}") < content.length - 10
        ) {
          console.warn(`   ⚠️ Response might be truncated!`);
        }

        for (const [topicName, data] of Object.entries(
          response.topic_percentages,
        )) {
          results[topicName] = {
            percentage: (data as any).percentage || 0,
          };
        }

        // Log sample of what AI returned
        const sampleTopics = aiTopics.slice(0, 5);
        console.log(
          `   - Sample topics from AI: ${sampleTopics.join(", ")}${aiTopics.length > 5 ? "..." : ""}`,
        );
      } else {
        console.error(`   ❌ AI response missing 'topic_percentages' field`);
        console.log(`   - Response structure:`, Object.keys(response));
      }

      console.log(`✅ AI analyzed ${Object.keys(results).length} topics`);
      return results;
    } catch (error) {
      console.error("Error in AI percentage analysis:", error);
      // Fallback: return empty results
      const results: Record<string, { percentage: number }> = {};
      allTopics.forEach((topic) => {
        results[topic.topic] = { percentage: 0 };
      });
      return results;
    }
  }
}

export const openaiService = new OpenAIAnalysisService();

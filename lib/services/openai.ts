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

class OpenAIAnalysisService {
  async performAnalysis(
    analysisType: string,
    reviews: ReviewMetadata[],
    competitorReviews?: ReviewMetadata[],
  ): Promise<AnalysisResult> {
    try {
      console.log(
        `Starting ${analysisType} analysis with ${reviews.length} reviews`,
      );

      const systemPrompt = this.getSystemPrompt(analysisType);
      const userPrompt = this.buildUserPrompt(
        analysisType,
        reviews,
        competitorReviews,
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const data = JSON.parse(content);

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
      const response = await openai.images.generate({
        model: "gpt-4o",
        prompt: `Professional headshot photo of ${personaDescription}. Realistic, clean background, business casual attire, friendly expression, high quality portrait photography style.`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      return response.data[0]?.url || null;
    } catch (error) {
      console.error("Error generating persona image:", error);
      return null;
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `You are a senior data analyst and e-commerce product insight strategist with over 10 years of experience working with review data for global brands. You consistently deliver structured, accurate, and business-ready analyses. Your writing is clear, engaging, neutral, and tailored to executives, brand owners, and marketers. You never fabricate data, and all insights must be grounded in the provided review content.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.`;

    const specificPrompts = {
      product_description: `${basePrompt}

Analyze the reviews to write a concise, neutral product description focused on product attributes (not customer opinions). Identify features, specifications, and variations.

Response format:
{
  "product_description": {
    "summary": "Short paragraph presenting a general description of the product",
    "attributes": ["Attribute 1", "Attribute 2"],
    "variations": ["Variation 1", "Variation 2"]
  }
}`,

      sentiment: `${basePrompt}

Identify recurring customer likes and dislikes. Group as Customer Likes and Customer Dislikes with themes, importance levels, percentages, and example quotes.

Response format:
{
  "sentiment_analysis": {
    "customer_likes": [
      {
        "theme": "Theme name",
        "importance": "High|Medium|Low",
        "percentage": "XX%",
        "summary": "Brief paragraph summarizing trends",
        "example_quote": "Customer quote"
      }
    ],
    "customer_dislikes": [
      {
        "theme": "Theme name",
        "importance": "High|Medium|Low", 
        "percentage": "XX%",
        "summary": "Brief paragraph summarizing trends",
        "example_quote": "Customer quote"
      }
    ]
  }
}`,

      voice_of_customer: `${basePrompt}

Identify the most frequent keywords and key phrases (2-3 words) from reviews.

Response format:
{
  "voice_of_customer": {
    "keywords": [
      {"word": "keyword1", "frequency": 45},
      {"word": "keyword2", "frequency": 32}
    ]
  }
}`,

      four_w_matrix: `${basePrompt}

Extract WHO is buying/using, WHAT the product is used as, WHERE it is used, WHEN it is used/purchased.

Response format:
{
  "four_w_matrix": {
    "who": [
      {
        "topic": "Topic name",
        "importance": "High|Medium|Low",
        "percentage": "XX%",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "what": [],
    "where": [],
    "when": []
  }
}`,

      jtbd: `${basePrompt}

Apply the Christensen methodology for Jobs To Be Done: Functional Jobs, Emotional Jobs, Social Jobs.

Response format:
{
  "jtbd_analysis": {
    "functional_jobs": [
      {
        "job_statement": "When [condition], I want [action], so that [outcome]",
        "percentage": "XX%",
        "importance": "High|Medium|Low",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "emotional_jobs": [],
    "social_jobs": []
  }
}`,

      stp: `${basePrompt}

Conduct Segmentation, Targeting, Positioning analysis.

Response format:
{
  "stp_analysis": {
    "market_definition": "Market description",
    "segmentation": [
      {
        "segment": "Segment name",
        "percentage": "XX%",
        "description": "Segment description",
        "attractiveness_factors": "Factors",
        "opportunities": "Opportunities",
        "challenges": "Challenges"
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

      swot: `${basePrompt}

Conduct SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats.

Response format:
{
  "swot_analysis": {
    "strengths": [
      {
        "topic": "Topic name",
        "percentage": "XX%",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  }
}`,

      customer_journey: `${basePrompt}

Generate Customer Journey Mapping: Awareness, Consideration, Purchase, Delivery/Unboxing, Usage, Post-Purchase.

Response format:
{
  "customer_journey": {
    "awareness": [
      {
        "topic": "Topic name",
        "percentage": "XX%",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ],
    "consideration": [],
    "purchase": [],
    "delivery_unboxing": [],
    "usage": [],
    "post_purchase": []
  }
}`,

      personas: `${basePrompt}

Generate 1-3 customer personas with demographics, psychographics, goals, pain points, buying behavior.

Response format:
{
  "customer_personas": [
    {
      "persona_name": "Name",
      "representation_percentage": "XX%",
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
  ]
}`,

      competition: `${basePrompt}

Generate Competition Analysis comparing features, strengths, weaknesses, customer segments.

Response format:
{
  "competition_analysis": {
    "comparison_matrix": [
      {
        "feature": "Feature name",
        "user_brand": "✅|❌|⚠️",
        "competitor_1": "✅|❌|⚠️",
        "competitor_2": "✅|❌|⚠️"
      }
    ],
    "usps": {
      "user_brand": "USP description",
      "competitor_1": "USP description",
      "competitor_2": "USP description"
    },
    "pain_points": {
      "user_brand": "Pain points",
      "competitor_1": "Pain points",
      "competitor_2": "Pain points"
    },
    "customer_segment_analysis": {
      "user_brand": "Who buys what",
      "competitor_1": "Who buys what",
      "competitor_2": "Who buys what"
    },
    "loyalty_indicators": {
      "user_brand": "Loyalty indicators",
      "competitor_1": "Loyalty indicators",
      "competitor_2": "Loyalty indicators"
    },
    "price_value_perception": {
      "price_sensitivity_mentions": {
        "user_brand": "Price sensitivity",
        "competitor_1": "Price sensitivity",
        "competitor_2": "Price sensitivity"
      },
      "willingness_to_pay": {
        "user_brand": "Willingness to pay",
        "competitor_1": "Willingness to pay",
        "competitor_2": "Willingness to pay"
      }
    }
  }
}`,

      strategic_recommendations: `${basePrompt}

Develop comprehensive Strategic Recommendations based on all previous analyses.

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

      rating_analysis: `${basePrompt}

Analyze reviews by rating distribution to identify what drives each rating level. Focus on themes that correlate with specific ratings.

Response format:
{
  "rating_analysis": {
    "ratings": [
      {
        "rating": 5,
        "count": 0,
        "percentage": "XX%",
        "top_themes": [
          {
            "theme": "Theme name",
            "frequency": 10
          }
        ]
      },
      {
        "rating": 4,
        "count": 0,
        "percentage": "XX%",
        "top_themes": []
      },
      {
        "rating": 3,
        "count": 0,
        "percentage": "XX%",
        "top_themes": []
      },
      {
        "rating": 2,
        "count": 0,
        "percentage": "XX%",
        "top_themes": []
      },
      {
        "rating": 1,
        "count": 0,
        "percentage": "XX%",
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
  ): string {
    let prompt = `Analyze the following customer reviews for ${analysisType} analysis:\n\n`;

    // Add main product reviews
    prompt += `MAIN PRODUCT REVIEWS (${reviews.length} reviews):\n`;
    reviews.slice(0, 100).forEach((review, index) => {
      prompt += `Review ${index + 1}:\n`;
      prompt += `Rating: ${review.rating || "N/A"}\n`;
      prompt += `Date: ${review.date || "N/A"}\n`;
      prompt += `Text: ${review.text}\n\n`;
    });

    // Add competitor reviews if available
    if (competitorReviews && competitorReviews.length > 0) {
      prompt += `\nCOMPETITOR REVIEWS (${competitorReviews.length} reviews):\n`;
      competitorReviews.slice(0, 50).forEach((review, index) => {
        prompt += `Competitor Review ${index + 1}:\n`;
        prompt += `Competitor ID: ${review.competitorId}\n`;
        prompt += `Rating: ${review.rating || "N/A"}\n`;
        prompt += `Text: ${review.text}\n\n`;
      });
    }

    prompt += `\nPerform the ${analysisType} analysis based on these reviews. Ensure all percentages are realistic and based on the actual review content provided.`;

    return prompt;
  }
}

export const openaiService = new OpenAIAnalysisService();

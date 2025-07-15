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
    existingAnalyses?: Record<string, any>,
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
        existingAnalyses,
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
        model: "dall-e-3",
        prompt: `a selfie for ${personaDescription}, warm ambient lighting, depth of field effect, high-resolution portrait style`,
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

  // Special SWOT analysis for competitors (only Strengths and Weaknesses)
  async performCompetitorSWOTAnalysis(
    reviews: ReviewMetadata[],
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
- Provide percentage of theme/topic representing in the reviews (approximate is fine)
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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
    "weaknesses": [
      {
        "topic": "Topic name",
        "percentage": "XX%",
        "summary": "Brief paragraph",
        "example_quote": "Customer quote"
      }
    ]
  }
}`;

      const userPrompt = this.buildUserPrompt("swot", reviews);

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
    const basePrompt = `You are a senior data analyst and e-commerce product insight strategist with over 10 years of experience working with review data for global brands. You consistently deliver structured, accurate, and business-ready analyses. Your writing is clear, engaging, neutral, and tailored to executives, brand owners, and marketers. You never fabricate data, and all insights must be grounded in the provided review content.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.`;

    const specificPrompts = {
      product_description: `You are a senior data analyst with over 10 years of experience in e-commerce analysis.

You are highly skilled in detecting key patterns in product review data

Your job is to:

- Create a product description: a concise, neutral and objective review of the product's features and specifications (e.g. material, size, dimensions, weight, colors,..etc) focusing on product's attributes not the reviewers' opinion.
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

      sentiment: `You are a Customer Insight Analyst with over 10 years of experience in analysing customer feedback.

You are highly skilled in:

- Identifying themes in review datasets
- Extracting what customers like (value drivers) and dislike (friction points)

Your job is to:

- Extract what the customers like (what they love, appreciate, or praise), and what the customers dislikes (what they complain about or want improved). Consider all themes/topics represent up from 5% of the reviews.
- Provide percentage of theme/topic representing in the reviews (approximate is fine)
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      voice_of_customer: `You are a Customer Insight Analyst with over 10 years of experience and have deep expertise in natural language processing, unstructured data cleanup, and keyword theme extraction from consumer feedback.

You are highly skilled in:

- Identifying themes in review datasets 
- Extracting the most frequently used words and phrases

Your job is to:

- Extract the most frequently used words and phrases, and count the frequency of those keywords and phrases as percentages (representing in the reviews)

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

      four_w_matrix: `You are a Consumer Insights Strategist with over 10 years of experience and have deep expertise in review analytics, contextual theme detection, and behavioural audience mapping.

You are highly skilled in:

- Identifying themes in review datasets.
- Identifying WHO is using/buying the product, WHAT the product is used as/for, WHERE it is placed/used in, and WHEN it is used or purchased (any special occasion/time/date).

Your job is to:

- Perform a Who / What / Where / When Matrix Analysis by extracting:
- Who is using/buying the product (e.g., son, teen, boyfriend, roommate, student, gamer, adult). Consider all themes/topics represent up from 5% of the reviews.
- What the product is used as/for (e.g., decor piece, gaming accessory, vibe setter). Consider all themes/topics represent up from 5% of the reviews.
- Where customers use or place the product (e.g., bedroom, dorm, game room, bathroom). Consider all themes/topics represent up from 5% of the reviews.
- When it is used or purchased (any special occasion e.g., birthdays, re-decorating, morning, Saturdays, seasonal events). Consider all themes/topics represent up from 5% of the reviews.
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      jtbd: `You are a Consumer Insights Strategist with over 10 years of experience and have deep expertise in review analytics, contextual theme detection, and behavioural audience mapping.

You are highly skilled in:

- Identifying themes in review datasets.
- Understanding customer intent based on natural language in reviews
- Using the Christensen methodology to identify three JTBD layers: Functional Jobs, Emotional Jobs, and Social Jobs.

Your job is to:

- By using the Christensen methodology create the three JTBD categories:
- Functional jobs (practical tasks) (e.g., re-decoration). Consider all jobs represent up from 5% of the reviews.
- Emotional jobs (feelings/desires) (e.g., express personality). Consider all jobs represent up from 5% of the reviews.
- Social jobs (social context) (e.g., conversation starter). Consider all jobs represent up from 5% of the reviews.
- Provide percentage of job representing in the reviews (approximate is fine)
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      stp: `You are a Strategic Marketing Consultant and Customer Insights Strategist with over 10 years of experience and have advanced skills in audience segmentation, behavioural targeting, and brand positioning based on product reviews.

You are highly skilled in:

- Identifying themes in review datasets.
- Analysing natural language to detect audience types, emotional needs, and use context.
- Customer persona segmentation, behavioural analysis, and emotional language modelling based on customer reviews.
- Creating STP Analysis (Segmentation, Targeting, Positioning) including what's the best targeting approach to select (Undifferentiated, Differentiated, or Concentrated), developing a clear positioning statement that defines how the product should be perceived by the target segment(s), outline the unique value proposition tailored to the target audience, implementing 4Ps (Product, Price, Place, Promotion) Implementation to support the positioning, and suggesting ideas for messaging and communication channels.
- Extracting persona patterns from customer reviews.

Your job is to:

- Conduct a full Segmentation → Targeting → Positioning analysis as follows:
1. Market Definition:
- Define the overall market and industry context relevant to the product. 
- Describe key trends, customer needs, and competitive environment.
1. Segmentation:
- Identify and describe meaningful market segments based on relevant criteria such as demographics, psychographics, geography, and behaviour. Consider all segments represent up from 5% of the reviews.
- Provide profiles for each segment including characteristics, preferences, and needs.
- Assess the attractiveness of each segment considering size, growth potential, profitability, accessibility, and competition.  
- Highlight any unique needs or differentiators within segments.
- Provide percentage of each segment representing in the reviews (approximate is fine)
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews
- generate a buyer persona represent each segment. Each persona has a name, and showing the percentage of representation in the total customers, for example "Sara represents 30% of your customers" and then showing Persona Snapshot Summary: "Hi I'm Sara, a 32-year-old teacher"

The Persona elements:

1) Demographics: Basic profile to humanize the persona: Age, Education level, Job title/occupation, Income range (if relevant), Living environment (city, suburb, rural)
1) Psychographics: Core values (e.g., quality, convenience, sustainability), Lifestyle (e.g., minimalist, gamer, parent, pet lover), Personality traits (e.g., cautious, trend-seeker, impulsive), Hobbies and interests
1) Goals & Motivations: What they want to achieve with the product
1) Pain Points / Frustrations: Problems they're trying to solve: Product-related issues (e.g., "product is cheap-looking"), Emotional pain (e.g., "I want to buy a meaningful gift but don't know what"), Functional pain (e.g., "Hard to clean, low quality")
1) Buying Behaviour: How they shop and decide: Purchase channels (Amazon, TikTok, Google, in-store), Research habits (do they read reviews, compare alternatives?), Decision triggers (price, visuals, social proof, urgency), Objections or barriers (e.g., delivery delay, perceived cheapness)
1) Product Use Behaviour: How often they use the product: In what context (home, office, gift), Who uses it (self, child, pet), How they maintain it (e.g., machine washable)
1) Influencers & Information Sources: What platforms they use (e.g., TikTok, Reddit, Instagram), Who they trust (e.g., influencers, Amazon reviews, friends), What content they consume (e.g., memes, decor tips, review videos)
1) Day in the Life: A typical day for the persona. It involves mapping out the persona's daily routines, activities, emotions, and interactions-not just with a product, but in their broader life context.
1. Targeting:

Generate a targeting approach (e.g., undifferentiated, differentiated, concentrated).

1. Positioning:
- Develop a clear positioning statement that defines how the product should be perceived by the target segment.  
- Outline the unique value proposition tailored to the target audience.  
- 4Ps Implementation: Suggest marketing mix elements (Product, Price, Place, Promotion) to support the positioning.  
- Include ideas for messaging and communication channels.
1. Implementation Recommendations
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
        "percentage": "XX%",
        "description": "Segment description",
        "attractiveness_factors": "Factors",
        "opportunities": "Opportunities",
        "challenges": "Challenges",
        "example_quote": "Customer quote",
        "buyer_persona": {
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

      swot: `You are a Brand Strategy Analyst with over 10 years of experience and have expert-level skills in customer review analysis, trend detection, market risk profiling, and SWOT modelling for consumer brands. You specialize in extracting actionable insights from messy, unstructured customer feedback.

You are highly skilled in:

- Identifying themes in review datasets.
- Understanding emotional tone, complaints, and contextual clues within natural language.
- Creating SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats).

Your job is:

- Conduct a full SWOT Analysis based on how frequently different themes appear in the reviews. Use natural language clues to classify:
- Strengths – What customers love. Consider all themes/topics represent up from 5% of the reviews.
- Weaknesses – What customers criticize. Consider all themes/topics represent up from 5% of the reviews.
- Opportunities – Where the brand can grow. Consider all themes/topics represent up from 5% of the reviews.
- Threats – Signals of dissatisfaction or damage risk. Consider all themes/topics represent up from 5% of the reviews.
- Provide percentage of theme/topic representing in the reviews (approximate is fine)
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      customer_journey: `You are a Customer Experience Strategist with over 10 years of experience and have advanced skills in journey design, review interpretation, and emotional insight modelling. You specialize in extracting full-funnel customer experiences from messy, unstructured review data.

You are highly skilled in:

- Identifying themes in review datasets.
- Tracking behaviour patterns and friction points across the journey lifecycle.
- Creating Customer Journey Mapping analysis.

Your job is to:

- Generate a Customer Journey Mapping analysis by breaking the customer journey into the following six stages:
- Awareness – How do customers first discover the product? Consider all themes/topics represent up from 5% of the reviews.
- Consideration – How they proceed the research phase (e.g., reviews, price comparisons), and what factors influence their decision? Consider all themes/topics represent up from 5% of the reviews.
- Purchase – How do customers describe the buying process, shipping, or delivery timelines? Consider all themes/topics represent up from 5% of the reviews.
- Delivery/Unboxing – The moment of receiving the product, what was the first impression? Are there any packaging issues? Do reviews mention unboxing surprises (whether negative or positive)? Consider all themes/topics represent up from 5% of the reviews.
- Usage – Where and how is the product used? How they feel about the product? Consider all themes/topics represent up from 5% of the reviews.
- Post-Purchase – Do customers return, complain, reorder, or recommend? Mention positive promoters and negative detractors. Consider all themes/topics represent up from 5% of the reviews.
- Provide percentage of theme/topic representing in the reviews (approximate is fine)
- Provide Importance: (High) for percentage up from 50%, (Medium) for percentage 25%-49%, (Low) for percentage below from 25%
- Provide real snippet or quote from the reviews
- For each stage:
- Identify Customer Actions: The specific activities or behaviours the customer performs at each stage (e.g., researching products, reading reviews, making a purchase, or sharing feedback). These describe what the customer does during that stage.
- Identify Touchpoints: The direct interactions or points of contact between the customer and the product during each stage (e.g., social media, Instagram, Amazon, websites).
- Identify Emotions: What were the feelings, sentiments, or emotional responses experienced by the customer at each stage.
- Identify Pain Points: What were the challenges, obstacles, or frustrations customers encounter at each stage that negatively impact their experience or decision-making.
- Identify Opportunities: Potential areas or ideas for enhancing the customer experience, addressing pain points, or capitalizing on positive moments to improve satisfaction, loyalty, or conversion rates.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      personas: `You are a Customer Insights Strategist with over 10 years of experience.

You are highly skilled in:

- Customer persona segmentation, behavioral analysis, and emotional language modeling based on customer reviews.
- Extracting persona patterns from customer reviews.

Your job is to generate 1-3 personas. Each persona has a name, and showing the percentage of representation in the total customers, for example "Sara represents 30% of your customers" and then showing Persona Snapshot Summary: "Hi I'm Sara, a 32-year-old mom"

The Persona elements:

- Demographics: Basic profile to humanize the persona: Age, Education level, Job title/occupation, Income range (if relevant), Living environment (city, suburb, rural)
- Psychographics: Core values (e.g., quality, convenience, sustainability), Lifestyle (e.g., minimalist, gamer, parent, pet lover), Personality traits (e.g., cautious, trend-seeker, impulsive), Hobbies and interests
- Goals & Motivations: What they want to achieve with the product
- Pain Points / Frustrations: Problems they're trying to solve: Product-related issues (e.g., "product is cheap-looking"), Emotional pain (e.g., "I want to buy a meaningful gift but don't know what"), Functional pain (e.g., "Hard to clean, low quality")
- Buying Behaviour: How they shop and decide: Purchase channels (Amazon, TikTok, Google, in-store), Research habits (do they read reviews, compare alternatives?), Decision triggers (price, visuals, social proof, urgency), Objections or barriers (e.g., delivery delay, perceived cheapness)
- Product Use Behaviour: How often they use the product: In what context (home, office, gift), Who uses it (self, child, pet), How they maintain it (e.g., machine washable)
- Influencers & Information Sources: What platforms they use (e.g., TikTok, Reddit, Instagram), Who they trust (e.g., influencers, Amazon reviews, friends), What content they consume (e.g., memes, decor tips, review videos)
- Day in the Life: A typical day for the persona. It involves mapping out the persona's daily routines, activities, emotions, and interactions-not just with a product, but in their broader life context.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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

      rating_analysis: `You are a Customer Insight Analyst with over 10 years of experience in analysing customer feedback.

You are highly skilled in:

- Identifying themes in review datasets
- Extracting what customers like (value drivers) and dislike (friction points)
- Identifying customer satisfaction evolving overtime based on product reviews

Your job is to:

- Analyse reviews by rating distribution to identify what drives each rating level. Focus on themes that correlate with specific ratings and count the frequency of those themes as percentages (representing in the reviews). Consider all themes represent up from 5% of the reviews.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

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
            "frequency": "XX%"
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

      smart_competition: `You are a Strategic Business Intelligence Analyst with over 15 years of experience in competitive analysis and market positioning. You specialize in transforming customer review data into actionable competitive strategies.

You are highly skilled in:

- Comparative analysis across multiple brands using structured data
- Identifying strategic opportunities and threats through customer feedback
- Creating differentiation frameworks and competitive positioning strategies
- Strategic recommendation generation based on competitive intelligence

Your job is to:

Conduct a comprehensive Smart Competition Analysis by comparing your product's analyses with detailed competitor analyses across 4 key dimensions:

1. PRODUCT ATTRIBUTES COMPARISON
- Compare ALL product features from your product description with ALL features from each competitor's product description
- Include attributes that appear in only one competitor or only in your product
- Calculate Differentiation Scores: 1 = only you have it, 0 = everyone has it, -1 = only competitors have it
- For "competitor_a", "competitor_b" etc fields, use the actual competitor names from the data

2. STRENGTHS & WEAKNESSES MATRIX
- Compare your SWOT analysis with each competitor's Strengths and Weaknesses
- Derive Opportunities: Where competitors are weak but you are strong
- Derive Threats: Where competitors are strong but you are weak
- Identify shared industry challenges and unique advantages

3. CUSTOMER SEGMENTATION OVERLAP
- Compare your STP segments with each competitor's segments
- Calculate overlap based on similar customer demographics and behaviors
- Identify segments that no one is targeting effectively
- Look for positioning opportunities in underserved segments

4. CUSTOMER JOURNEY FRICTION ANALYSIS
- Compare journey stages between you and competitors
- Calculate friction scores based on pain points and issues mentioned
- Lower score = better experience, Higher score = more friction
- Identify where each brand excels or struggles

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.

Response format:
{
  "smart_competition_analysis": {
    "product_attributes": {
      "attribute_comparison": [
        {
          "attribute": "Feature name",
          "you_have": true,
          "competitors": {
            "Competitor Name 1": true,
            "Competitor Name 2": false
          },
          "differentiation_score": 0.5,
          "strategic_value": "high|medium|low",
          "customer_importance": "XX%"
        }
      ],
      "unique_advantages": ["Advantage 1", "Advantage 2"],
      "feature_gaps": ["Missing feature 1", "Missing feature 2"],
      "strategic_recommendations": ["Recommendation 1", "Recommendation 2"]
    },
    "swot_matrix": {
      "strength_comparison": {
        "your_strengths": ["Strength 1", "Strength 2"],
        "competitor_strengths": {
          "Competitor Name 1": ["Their Strength 1", "Their Strength 2"],
          "Competitor Name 2": ["Their Strength 1", "Their Strength 2"]
        },
        "competitive_advantages": ["Where you win vs them"],
        "strength_gaps": ["Where they win vs you"]
      },
      "weakness_comparison": {
        "your_weaknesses": ["Weakness 1", "Weakness 2"],
        "competitor_weaknesses": {
          "Competitor Name 1": ["Their Weakness 1", "Their Weakness 2"],
          "Competitor Name 2": ["Their Weakness 1", "Their Weakness 2"]
        },
        "shared_weaknesses": ["Common industry issues"],
        "relative_advantages": ["Their weaknesses you don't have"]
      },
      "derived_opportunities": ["Strategic opportunity 1", "Strategic opportunity 2"],
      "derived_threats": ["Strategic threat 1", "Strategic threat 2"]
    },
    "segmentation_analysis": {
      "your_primary_segments": ["Segment 1 (XX%)", "Segment 2 (XX%)"],
      "competitor_segments": {
        "Competitor Name 1": ["Their Segment 1 (XX%)", "Their Segment 2 (XX%)"],
        "Competitor Name 2": ["Their Segment 1 (XX%)", "Their Segment 2 (XX%)"]
      },
      "overlap_analysis": {
        "Competitor Name 1": {"overlap_score": 25, "shared_segments": ["Segment names"]},
        "Competitor Name 2": {"overlap_score": 40, "shared_segments": ["Segment names"]}
      },
      "untapped_segments": ["Segment nobody targets"],
      "positioning_opportunity": "Strategic positioning insight",
      "segment_recommendations": ["Target this segment", "Defend this position"]
    },
    "journey_analysis": {
      "awareness": {
        "your_friction_score": 7.2,
        "competitor_scores": {
          "Competitor Name 1": 3.1,
          "Competitor Name 2": 4.5
        },
        "winner": "Competitor Name 1",
        "gap_analysis": "What they do better",
        "improvement_opportunity": "How you can improve"
      },
      "purchase": {
        "your_friction_score": 2.1,
        "competitor_scores": {
          "Competitor Name 1": 5.8,
          "Competitor Name 2": 4.2
        },
        "winner": "you",
        "gap_analysis": "What you do better",
        "competitive_advantage": "Why this matters"
      },
      "post_purchase": {
        "your_friction_score": 1.2,
        "competitor_scores": {
          "Competitor Name 1": 8.9,
          "Competitor Name 2": 6.3
        },
        "winner": "you",
        "gap_analysis": "What you do better",
        "competitive_advantage": "Why this matters"
      },
      "strategic_focus": "Primary area needing improvement",
      "journey_recommendations": ["Tactical recommendation 1", "Tactical recommendation 2"]
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
  ): string {
    // Special handling for smart competition analysis
    if (
      analysisType === "smart_competition" &&
      existingAnalyses &&
      competitorReviews
    ) {
      return this.buildSmartCompetitionPrompt(
        existingAnalyses,
        competitorReviews,
      );
    }

    let prompt = `Analyze the following customer reviews for ${analysisType} analysis:\n\n`;

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

  private buildSmartCompetitionPrompt(
    existingAnalyses: Record<string, any>,
    competitorReviews: ReviewMetadata[],
  ): string {
    let prompt = `Conduct a Smart Competition Analysis by comparing your existing product insights with comprehensive competitor analyses.\n\n`;

    // Add existing analysis data
    prompt += `YOUR PRODUCT'S EXISTING ANALYSIS DATA:\n\n`;

    if (existingAnalyses.product_description) {
      prompt += `PRODUCT DESCRIPTION ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.product_description, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.swot) {
      prompt += `SWOT ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.swot, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.stp) {
      prompt += `STP ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.stp, null, 2);
      prompt += `\n\n`;
    }

    if (existingAnalyses.customer_journey) {
      prompt += `CUSTOMER JOURNEY ANALYSIS:\n`;
      prompt += JSON.stringify(existingAnalyses.customer_journey, null, 2);
      prompt += `\n\n`;
    }

    // Add competitor analyses
    if (existingAnalyses.competitorAnalyses) {
      prompt += `COMPETITOR ANALYSES:\n\n`;

      for (const [competitorId, analyses] of Object.entries(
        existingAnalyses.competitorAnalyses,
      )) {
        const competitorData = analyses as any;
        prompt += `COMPETITOR: ${competitorData.name} (ID: ${competitorId})\n\n`;

        if (competitorData.product_description) {
          prompt += `Product Description:\n`;
          prompt += JSON.stringify(competitorData.product_description, null, 2);
          prompt += `\n\n`;
        }

        if (competitorData.swot) {
          prompt += `SWOT Analysis (Strengths & Weaknesses):\n`;
          prompt += JSON.stringify(competitorData.swot, null, 2);
          prompt += `\n\n`;
        }

        if (competitorData.stp) {
          prompt += `STP Analysis:\n`;
          prompt += JSON.stringify(competitorData.stp, null, 2);
          prompt += `\n\n`;
        }

        if (competitorData.customer_journey) {
          prompt += `Customer Journey:\n`;
          prompt += JSON.stringify(competitorData.customer_journey, null, 2);
          prompt += `\n\n`;
        }
      }
    }

    prompt += `\nBased on comparing your comprehensive analysis data with the detailed competitor analyses, perform a Smart Competition Analysis that:
    
1. For Product Attributes: Compare all attributes found in your product description AND all attributes found in each competitor's product description. Look for features mentioned in competitor reviews that might not be in your product.

2. For SWOT Matrix: Compare your SWOT with each competitor's Strengths and Weaknesses. Derive Opportunities from where competitors are weak but you are strong. Derive Threats from where competitors are strong but you are weak.

3. For Segmentation: Compare your customer segments with each competitor's segments. Look for overlaps and gaps in targeting.

4. For Customer Journey: Compare friction points at each stage of the journey between you and competitors.

Focus on strategic intelligence and actionable insights.`;

    return prompt;
  }
}

export const openaiService = new OpenAIAnalysisService();

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface ImageGenerationResult {
  url: string | null;
  error?: string;
}

class ReplicateImageService {
  async generatePersonaImage(
    personaDescription: string,
  ): Promise<string | null> {
    try {
      console.log(
        "Generating persona image with Flux-1.1-Pro:",
        personaDescription,
      );

      const input = {
        prompt: `a professional headshot portrait of ${personaDescription}, high quality, warm lighting, professional photography style, 35mm lens, soft focus background`,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
      };

      const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
        input,
      });

      console.log("Replicate output:", output);

      // Handle different response formats
      let imageUrl: string | null = null;

      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (typeof output === "string") {
        imageUrl = output;
      } else if (output && typeof output === "object" && "url" in output) {
        imageUrl = (output as any).url;
      }

      if (
        imageUrl &&
        typeof imageUrl === "string" &&
        imageUrl.startsWith("http")
      ) {
        console.log(
          "Successfully generated image with Flux-1.1-Pro:",
          imageUrl,
        );
        return imageUrl;
      }

      console.error(
        "No valid image URL returned from Flux-1.1-Pro, got:",
        output,
      );
      return null;
    } catch (error) {
      console.error("Error generating persona image with Flux-1.1-Pro:", error);
      return null;
    }
  }

  async generateImage(
    prompt: string,
    options?: {
      aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
      output_format?: "webp" | "jpg" | "png";
      output_quality?: number;
      safety_tolerance?: number;
    },
  ): Promise<string | null> {
    try {
      console.log("Generating image with Flux-1.1-Pro:", prompt);

      const input = {
        prompt,
        aspect_ratio: options?.aspect_ratio || "1:1",
        output_format: options?.output_format || "webp",
        output_quality: options?.output_quality || 90,
        safety_tolerance: options?.safety_tolerance || 2,
      };

      const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
        input,
      });

      console.log("Replicate output:", output);

      // Handle different response formats
      let imageUrl: string | null = null;

      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (typeof output === "string") {
        imageUrl = output;
      } else if (output && typeof output === "object" && "url" in output) {
        imageUrl = (output as any).url;
      }

      if (
        imageUrl &&
        typeof imageUrl === "string" &&
        imageUrl.startsWith("http")
      ) {
        console.log(
          "Successfully generated image with Flux-1.1-Pro:",
          imageUrl,
        );
        return imageUrl;
      }

      console.error(
        "No valid image URL returned from Flux-1.1-Pro, got:",
        output,
      );
      return null;
    } catch (error) {
      console.error("Error generating image with Flux-1.1-Pro:", error);
      return null;
    }
  }
}

export const replicateService = new ReplicateImageService();

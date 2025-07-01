"use client";

import { VoiceOfCustomer } from "./voice-of-customer";
import { RatingAnalysis } from "./rating-analysis";
import { SentimentAnalysis } from "./sentiment-analysis";
import { FourWMatrix } from "./four-w-matrix";

interface VOCCombinedProps {
  analyses: {
    voice_of_customer?: any;
    rating_analysis?: any;
    sentiment?: any;
    four_w_matrix?: any;
  };
}

export function VOCCombined({ analyses }: VOCCombinedProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-[#104862] mb-4">Voice of Customer</h3>
        <VoiceOfCustomer analysis={analyses.voice_of_customer} />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#104862] mb-4">Rating Analysis</h3>
        <RatingAnalysis analysis={analyses.rating_analysis} />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#104862] mb-4">Sentiment Analysis</h3>
        <SentimentAnalysis analysis={analyses.sentiment} />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#104862] mb-4">4W Matrix Analysis</h3>
        <FourWMatrix analysis={analyses.four_w_matrix} />
      </div>
    </div>
  );
}
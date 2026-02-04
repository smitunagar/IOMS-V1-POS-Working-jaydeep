
"use server";

import { ai } from '@/ai/genkit';
import {
  SuggestExpiryDateInput,
  SuggestExpiryDateOutput,
  SuggestExpiryDateInputSchema,
  SuggestExpiryDateOutputSchema,
} from './ingredient-types';

const prompt = ai.definePrompt({
  name: 'suggestExpiryDatePrompt',
  input: { schema: SuggestExpiryDateInputSchema },
  output: { schema: SuggestExpiryDateOutputSchema },
  prompt: `You are a food safety expert and inventory management specialist. Based on the product information provided, suggest an appropriate expiry date and storage recommendations.

Product Information:
- Name: {{productName}}
- Category: {{productCategory}}
- Weight/Unit: {{productWeight}}
- Manufacturing Date: {{manufacturingDate}}

Please provide:
1. A suggested expiry date in YYYY-MM-DD format (based on typical shelf life for this type of product)
2. The estimated shelf life in days
3. Storage recommendations to maximize freshness
4. Confidence level in your suggestion (High, Medium, Low)

Consider factors like:
- Product type and category (tea, spices, sweets, etc.)
- Packaging type and weight
- Typical shelf life for similar products
- Storage conditions that affect shelf life

Return the output as a JSON object with the following structure:
{
  "suggestedExpiryDate": "YYYY-MM-DD",
  "shelfLifeDays": number,
  "storageRecommendation": "string",
  "confidence": "High|Medium|Low"
}

Be conservative with expiry dates to ensure food safety. If manufacturing date is provided, calculate from that date. If not, assume current date as starting point.`,
});

const suggestExpiryDateFlow = ai.defineFlow(
  {
    name: 'suggestExpiryDateFlow',
    inputSchema: SuggestExpiryDateInputSchema,
    outputSchema: SuggestExpiryDateOutputSchema,
  },
  async input => {
    // Provide fallback values for missing fields
    const safeInput = {
      ...input,
      productCategory: input.productCategory || "Not specified",
      productWeight: input.productWeight || "Not specified",
      manufacturingDate: input.manufacturingDate || "Not specified",
    };
    const { output } = await prompt(safeInput);
    if (!output) {
      throw new Error('AI did not return an output.');
    }
    return output;
  }
);

export async function suggestExpiryDate(input: SuggestExpiryDateInput): Promise<SuggestExpiryDateOutput> {
  return suggestExpiryDateFlow(input);
} 


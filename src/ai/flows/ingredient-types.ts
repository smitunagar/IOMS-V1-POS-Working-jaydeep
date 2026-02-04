import { z } from 'genkit';

export const GenerateIngredientsListInputSchema = z.object({
  dishName: z.string().describe('The name of the dish to generate ingredients for.'),
  numberOfServings: z.number().describe('The number of servings the ingredients should be for.'),
});
export type GenerateIngredientsListInput = z.infer<typeof GenerateIngredientsListInputSchema>;

export const IngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  quantity: z.number().describe('The quantity of the ingredient (numeric value).'),
  unit: z.string().describe('The unit for the quantity (e.g., "g", "ml", "pcs", "kg").'),
});

export const GenerateIngredientsListOutputSchema = z.object({
  ingredients: z.array(IngredientSchema).describe('A list of ingredients with their names, quantities, and units.'),
});
export type GenerateIngredientsListOutput = z.infer<typeof GenerateIngredientsListOutputSchema>;

// New schemas for expiry date suggestion
export const SuggestExpiryDateInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productCategory: z.string().optional().describe('The category of the product (e.g., "Tea", "Spices", "Sweets").'),
  productWeight: z.string().optional().describe('The weight/unit of the product (e.g., "500g", "1000g", "20 pkt").'),
  manufacturingDate: z.string().optional().describe('The manufacturing date if available.'),
});
export type SuggestExpiryDateInput = z.infer<typeof SuggestExpiryDateInputSchema>;

export const SuggestExpiryDateOutputSchema = z.object({
  suggestedExpiryDate: z.string().describe('The suggested expiry date in YYYY-MM-DD format.'),
  shelfLifeDays: z.number().describe('The estimated shelf life in days.'),
  storageRecommendation: z.string().describe('Storage recommendation for the product.'),
  confidence: z.string().describe('Confidence level of the suggestion (High, Medium, Low).'),
});
export type SuggestExpiryDateOutput = z.infer<typeof SuggestExpiryDateOutputSchema>;

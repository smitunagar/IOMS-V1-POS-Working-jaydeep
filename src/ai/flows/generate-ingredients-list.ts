"use server";

import { ai } from '@/ai/genkit';
import {
  GenerateIngredientsListInput,
  GenerateIngredientsListOutput,
  GenerateIngredientsListInputSchema,
  GenerateIngredientsListOutputSchema,
  IngredientSchema
} from './ingredient-types';

const prompt = ai.definePrompt({
  name: 'generateIngredientsListPrompt',
  input: { schema: GenerateIngredientsListInputSchema },
  output: { schema: GenerateIngredientsListOutputSchema },
  prompt: `You are a chef. Generate a list of ingredients needed for the dish "{{dishName}}" for {{numberOfServings}} servings.

IMPORTANT:
- The language of the ingredient names and units must always match the language of the dish name. If the dish name is in German, all ingredient names and units must be in German. If the dish name is in English, use English. Do not translate or mix languages.
- Always include the main protein or key ingredient (e.g., if the dish is "Palak Chicken" or "Chicken Palak", always include "Chicken" as an ingredient).

For each ingredient, provide its name, quantity (as a number), and unit (e.g., "g", "ml", "pcs", "kg").
Never return a quantity of 0. If unsure, estimate a typical amount for one serving based on common recipes or chef experience.
Return the output as a JSON object with a single key "ingredients".
The "ingredients" key should have a value of an array of objects, where each object has "name" (string), "quantity" (number), and "unit" (string) fields.
Be as accurate as possible.

Example (English):
{
  "ingredients": [
    { "name": "Chicken Breast", "quantity": 200, "unit": "g" },
    { "name": "Spinach", "quantity": 150, "unit": "g" },
    { "name": "Onion", "quantity": 50, "unit": "g" }
  ]
}

Example (German):
{
  "ingredients": [
    { "name": "Hähnchenbrust", "quantity": 200, "unit": "g" },
    { "name": "Spinat", "quantity": 150, "unit": "g" },
    { "name": "Zwiebel", "quantity": 50, "unit": "g" }
  ]
}

Ensure the output strictly follows this JSON format.`,
});

const generateIngredientsListFlow = ai.defineFlow(
  {
    name: 'generateIngredientsListFlow',
    inputSchema: GenerateIngredientsListInputSchema,
    outputSchema: GenerateIngredientsListOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output.');
    }
    return output;
  }
);

export async function generateIngredientsList(input: GenerateIngredientsListInput): Promise<GenerateIngredientsListOutput> {
  return generateIngredientsListFlow(input);
}

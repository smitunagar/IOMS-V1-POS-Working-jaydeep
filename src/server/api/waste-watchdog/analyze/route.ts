import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's a rate limit error and we haven't exceeded max retries
      if (error.status === 429 && attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await delay(delayMs);
        continue;
      }
      
      // For other errors or max retries exceeded, throw the error
      throw error;
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Convert base64 to data URI format for Genkit
    const imageDataUri = `data:image/jpeg;base64,${base64Data}`;
    
    // Validate the data URI format
    if (!imageDataUri.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 });
    }
    
    console.log('Image data URI prepared, length:', imageDataUri.length);

    // Analyze the image using Gemini with retry logic
    console.log('Starting Gemini analysis for image...');
    
    const result = await retryWithBackoff(async () => {
      return await ai.generate([
        {
          text: `Analyze this food waste image and provide the following information in JSON format:
          
          {
            "dishName": "Name of the dish or food item",
            "confidence": 0.95,
            "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
            "estimatedWaste": "Estimated amount of waste in grams/units",
            "carbonFootprint": "Estimated carbon footprint in CO2 equivalent",
            "recommendations": [
              "Recommendation 1 for reducing waste",
              "Recommendation 2 for better food management",
              "Recommendation 3 for sustainability"
            ]
          }
          
          Please be specific about the dish identification and provide realistic waste estimates and carbon footprint calculations. Focus on food waste reduction and sustainability.`
        },
        {
          media: { url: imageDataUri }
        }
      ]);
    });
    
    console.log('Gemini analysis completed, processing result...');
    
    if (!result || !result.text) {
      throw new Error('No response text from Gemini API');
    }

    let parsedResult;
    try {
      // Try to parse the response as JSON
      parsedResult = JSON.parse(result.text);
    } catch (parseError) {
      console.log('Failed to parse JSON, attempting to extract JSON from response...');
      
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       result.text.match(/```\s*([\s\S]*?)\s*```/) ||
                       result.text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError);
          throw new Error('Invalid JSON response from AI service');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate the parsed result
    if (!parsedResult.dishName) {
      throw new Error('AI response missing required dish name');
    }

    console.log('Successfully parsed AI response:', parsedResult);

    return NextResponse.json(parsedResult);
    
  } catch (error: any) {
    console.error('WasteWatchDog analysis error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        details: 'The AI service is currently busy. Please wait a few seconds before making another request.',
        retryAfter: 30, // seconds
        suggestion: 'Try again in 30 seconds or reduce the frequency of requests.'
      }, { status: 429 });
    }
    
    if (error.message?.includes('API key') || error.message?.includes('FAILED_PRECONDITION')) {
      return NextResponse.json({
        error: 'AI service configuration error',
        details: 'Please check your API key configuration.',
        suggestion: 'Ensure you have a valid Gemini API key in your .env.local file'
      }, { status: 500 });
    }
    
    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return NextResponse.json({
        error: 'Service quota exceeded',
        details: 'You have exceeded the allowed number of requests.',
        suggestion: 'Please wait before making another request or upgrade your plan.'
      }, { status: 429 });
    }
    
    // Generic error response
    return NextResponse.json({
      error: 'Analysis failed',
      details: error.message || 'An unexpected error occurred during image analysis.',
      suggestion: 'Please try again with a different image or contact support if the issue persists.'
    }, { status: 500 });
  }
}

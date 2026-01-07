
import { GoogleGenAI } from "@google/genai";

/**
 * Performs OCR on uploaded screenshots using Gemini 3 Flash.
 * @param imageFiles Array of image files (JPG/PNG)
 * @returns Array of unique participant names found in the images
 */
export async function performOCR(imageFiles: File[]): Promise<string[]> {
  // Always use process.env.API_KEY directly as per SDK requirements.
  // The shim in index.tsx ensures this does not crash in browsers.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = await Promise.all(
    imageFiles.map(async (file) => {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };
    })
  );

  const prompt = `
    This is one or more screenshots from a video meeting (Zoom/Meet/Teams).
    Please extract ALL the visible participant names. 
    Look for names in participant lists, gallery view labels, or chat mentions if they represent attendance.
    Return only a JSON array of strings containing the unique names found.
    Format: ["Name 1", "Name 2", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json"
      }
    });

    // Access the .text property directly as per the latest @google/genai guidelines.
    const text = response.text;
    
    if (!text) {
      console.warn("Gemini returned an empty response.");
      return [];
    }
    
    // Clean potential markdown formatting if model returned it despite JSON request
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    // Provide a more descriptive error if it's likely a missing API key
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please ensure the environment is configured correctly.");
    }
    throw new Error("Failed to process screenshots via Gemini OCR. Ensure your images are clear and API limits aren't exceeded.");
  }
}

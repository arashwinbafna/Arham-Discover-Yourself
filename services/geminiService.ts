
import { GoogleGenAI } from "@google/genai";

export async function performOCR(imageFiles: File[]): Promise<string[]> {
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

    const text = response.text || "[]";
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to process screenshots via Gemini OCR.");
  }
}

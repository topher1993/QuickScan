import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractDetailsFromImage = async (base64Image: string, mimeType: string): Promise<ExtractedData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Extract 'name', 'phoneNumber', and 'amount' for a payment receipt. Focus on mobile numbers. IMPORTANT: Format phoneNumber as a pure string of digits starting with 09 (e.g., 09171234567). If the image shows +639..., convert it to 09... Remove any spaces or dashes. The amount should be a pure number. If a field is missing, use 'Unknown' or 0.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the person or entity",
            },
            phoneNumber: {
              type: Type.STRING,
              description: "The mobile phone number found (e.g., 09xxxxxxxxx)",
            },
            amount: {
              type: Type.NUMBER,
              description: "The monetary amount found",
            },
          },
          required: ["name", "phoneNumber", "amount"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedData;
    }
    throw new Error("No text returned from API");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
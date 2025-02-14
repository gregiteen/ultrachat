import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key environment variable');
}

// Initialize the API with safety settings
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const defaultGenerationConfig = {
  maxOutputTokens: 2048,
  temperature: 0.9,
  topK: 1,
  topP: 1,
};

// Helper function to get the chat model
export const getChatModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',  // Using Gemini 2.0 Flash for better performance
    safetySettings,
    generationConfig: defaultGenerationConfig,
  });
};

// Helper function to get the vision model
export const getVisionModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',  // Using Gemini 2.0 Flash for multimodal
    safetySettings,
    generationConfig: defaultGenerationConfig,
  });
};

// Helper to convert file to GenerativeContent
export async function fileToGenerativeContent(file: File): Promise<{
  inlineData: {
    data: string;
    mimeType: string;
  };
}> {
  // Check file size (max 4MB for Gemini API)
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.name} is too large. Maximum size is 4MB.`);
  }

  try {
    // Read file as base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type || 'application/octet-stream'
          }
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    throw new Error(`Failed to process file ${file.name}: ${error.message}`);
  }
}

// Helper to determine if we need the vision model
export function needsVisionModel(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'video/mp4',
    'video/webm'
  ];
  return supportedTypes.includes(fileType.toLowerCase());
}

// Helper to check if file type is supported
export function isSupportedFileType(fileType: string): boolean {
  const supportedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    // Video
    'video/mp4',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Documents
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/html',
    'application/xml',
    'text/xml'
  ];
  return supportedTypes.includes(fileType.toLowerCase());
}

// Helper to process multiple files for multimodal input
export async function processMultimodalInput(files: File[]): Promise<Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>> {
  const parts = [];
  
  for (const file of files) {
    if (needsVisionModel(file.type)) {
      const content = await fileToGenerativeContent(file);
      parts.push(content);
    } else if (isSupportedFileType(file.type)) {
      const text = await file.text();
      parts.push({ text: `File: ${file.name}\n${text}` });
    }
  }
  
  return parts;
}
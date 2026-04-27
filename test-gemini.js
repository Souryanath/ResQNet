import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  try {
    const prompt = `You are an emergency AI assistant. A user just reported a Medical emergency. They provided the following details: "test". Provide exactly 2 short, calm, and actionable survival instructions. Keep it under 30 words total. Do not use markdown or bold text.`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("SUCCESS");
    console.log("RESPONSE:", JSON.stringify(responseText));
  } catch (error) {
    console.log("ERROR");
    console.error(error);
  }
}

run();

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = "AIzaSyDA5OL5MTR5vHGZtHgh209h0QcP-5gpGhs";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

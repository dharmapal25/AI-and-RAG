 const { Pinecone } = require("@pinecone-database/pinecone");
 const { GoogleGenAI } = require("@google/genai");
 const { Groq } = require("groq-sdk/client.js");


//  Pinecone API KEY
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
})

// Google GenAI API KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const gemini = new GoogleGenAI({
    apiKey: GOOGLE_API_KEY
})

// Groq API KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({
    apiKey: GROQ_API_KEY
})

module.exports = {
    pinecone,
    gemini,
    groq
}
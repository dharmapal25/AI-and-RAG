// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "groq/compound",

      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || "No response";

    res.status(200).json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});




app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
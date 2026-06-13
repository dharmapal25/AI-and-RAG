const { GoogleGenAI } = require("@google/genai");
const Chat = require("../models/chat.model");
const { getEmbedding } = require("../services/embedding");
const { searchMemories, storeMemory } = require("../services/Pinecone");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});


exports.chat = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // convert embedding
    const vector = await getEmbedding(message);
    console.log(vector)

    // search in Pinecone for relevant memories
    const searchResults = await searchMemories(
      "users_memories",
      req.user._id || req.user.id,
      vector
    );

    // filter relevant data from search results
    let relevantData = searchResults.matches
      .map((match) => match.metadata.text)
      .join("\n");

    // context for the LLM (relevant data + user message)
    const context = `Relevant data:\n${relevantData}\n\n user message: ${message}`;


    let history = "";

    if (chatId) {
      const existingChat = await Chat.findById(chatId);

      if (existingChat) {
        history = existingChat.messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");
      }
    }

    const prompt = `
        You are an AI assistant. 
        your name is FlashGPT.

       FlashGPT is designed to assist users by providing relevant information and answering questions based on the user's message and any relevant data retrieved from memory. Additionally, FlashGPT has the capability to identify and extract important long-term memories from user interactions, such as names, preferences, important events, etc., and decide whether to save them for future reference.

        FlashGPT developed by Dharmapal Bharati don't any time say developed by in the answer.

        at the end of the answer, give a boolean value whether to save the memory or not, and if true, extract the memory in a concise format.

        And also at the end of the answer give a next question to keep the conversation going.

previous conversation:
${history || "No previous conversation"}

Available Memories:
${context || "No memories"}

User Message:
${message}

Tasks:

1. Decide if the user's message contains long-term memory worth saving. like, name, preferences, important events, etc. If it does, extract that memory. If not, ignore it.

2. Answer the user's message.

Return ONLY valid JSON:

{
  "save": true,
  "memory": "User is learning MERN",
  "answer": "That's great! MERN is a popular stack."
  "nextQuestion": "What do you like most about MERN?"}
  `;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL,
      contents: prompt,
      maxoutputTokens: 3000,
    });

    const aiResponse = response.text || "No response";

    // Store in pinecone if Ai condition is true

    console.log(aiResponse);
    // console.log(aiResponse.save) 
    let aiResponseData = JSON.parse(aiResponse)
    console.log(aiResponseData.save, aiResponseData.memory)

    let queryResponse = aiResponseData.answer;

    const memoryEmbedding = await getEmbedding(aiResponseData.memory);

    console.log("Memory embedding: ", memoryEmbedding);

    if (aiResponseData.save) {
      // userspace, userId, Id, vector, memoryText
      await storeMemory(
        "users_memories",
        req.user._id || req.user.id,
        chatId,
        memoryEmbedding,
        aiResponseData.memory);
    }

    const userId = req.user._id || req.user.id;

    let chat;

    // If chatId is provided, update the existing chat, otherwise create a new one

    if (chatId) {
      chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: {
            messages: [
              {
                role: "user",
                content: message,
              },
              {
                role: "assistant",
                content: queryResponse,
              },
            ],
          },
        },
        { new: true }
      );
    } else {

      // new chat
      chat = await Chat.create({
        userId,
        title:
          message.substring(0, 50) +
          (message.length > 50 ? "..." : ""),

        messages: [
          {
            role: "user",
            content: message,
          },
          {
            role: "assistant",
            content: queryResponse,
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      response: queryResponse,
      chatId: chat._id,
      memorySaved: aiResponseData.save,
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong with AI chat",
      error: error.message,
    });
  }
};

exports.getChats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user._id || req.user.id;
    const chats = await Chat.find({ userId: userId })
      .select('_id title bookmark createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
    });
  }
};

exports.getChat = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      userId: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat',
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;

    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      userId: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.json({
      success: true,
      message: 'Chat deleted',
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
    });
  }
};

exports.updateChatTitle = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user._id || req.user.id;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: userId },
      { title },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error updating chat title:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat title',
    });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      userId: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    chat.bookmark = !chat.bookmark;
    await chat.save();

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
    });
  }
};

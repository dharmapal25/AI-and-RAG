const Groq = require("groq-sdk");
const Chat = require("../models/chat.model");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.chat = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || "No response";

    // Save messages to database
    let chat;
    if (chatId) {
      // Update existing chat
      chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: {
            messages: [
              { role: 'user', content: message },
              { role: 'assistant', content: aiResponse }
            ]
          }
        },
        { new: true }
      );
    } else {
      // Create new chat
      chat = await Chat.create({
        userId: req.user.id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: aiResponse }
        ]
      });
    }

    res.status(200).json({
      success: true,
      response: aiResponse,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Groq API Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong with AI chat",
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

    const chats = await Chat.find({ userId: req.user.id })
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

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
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

    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      userId: req.user.id,
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

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user.id },
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

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
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

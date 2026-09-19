const JourneyAssistantConversation = require("../models/JourneyAssistantConversation");
const journeyAssistantService = require("../services/journeyAssistantService");

/**
 * @desc    Send a message to AI Journey Assistant
 * @route   POST /api/journey-assistant/chat
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { message, journeyId, conversationId: clientConvId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "A valid non-empty message is required." });
    }

    const conversationId = clientConvId || `conv_${req.user._id}_${Date.now()}`;
    const cleanMessage = message.trim();

    // 1. Process Assistant response with context gathering & safety checks
    const assistantResult = await journeyAssistantService.processAssistantChat(
      req.user._id,
      cleanMessage,
      journeyId
    );

    // 2. Save User Message
    const userMsgDoc = new JourneyAssistantConversation({
      conversationId,
      userId: req.user._id,
      sender: "user",
      message: cleanMessage,
      journeyId: journeyId || null,
      isEmergency: assistantResult.isEmergency,
      contextSnapshot: assistantResult.contextSnapshot,
    });
    await userMsgDoc.save();

    // 3. Save Assistant Message
    const assistantMsgDoc = new JourneyAssistantConversation({
      conversationId,
      userId: req.user._id,
      sender: "assistant",
      message: assistantResult.message,
      journeyId: journeyId || null,
      isEmergency: assistantResult.isEmergency,
      contextSnapshot: assistantResult.contextSnapshot,
      suggestedPlaces: assistantResult.suggestedPlaces || [],
    });
    await assistantMsgDoc.save();

    return res.status(200).json({
      success: true,
      conversationId,
      userMessage: userMsgDoc,
      reply: assistantResult.message,
      assistantMessage: assistantMsgDoc,
      isEmergency: assistantResult.isEmergency,
      suggestedPlaces: assistantResult.suggestedPlaces || [],
      contextSnapshot: assistantResult.contextSnapshot,
      context: assistantResult.context || null,
    });
  } catch (error) {
    console.error("Error in journeyAssistantController.sendMessage:", error);
    return res.status(500).json({
      success: false,
      message: "I'm unable to access the required journey information right now. Please try again shortly or check the relevant PilgrimIQ section.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current Journey Context Snapshot
 * @route   GET /api/journey-assistant/context
 * @access  Private
 */
const getJourneyContext = async (req, res) => {
  try {
    const { journeyId } = req.query;
    const context = await journeyAssistantService.collectJourneyContext(req.user._id, journeyId);
    return res.status(200).json({ success: true, context });
  } catch (error) {
    console.error("Error in journeyAssistantController.getJourneyContext:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve journey context.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Chat History
 * @route   GET /api/journey-assistant/history
 * @access  Private
 */
const getConversationHistory = async (req, res) => {
  try {
    const { conversationId, journeyId } = req.query;
    const filter = { userId: req.user._id };

    if (conversationId) filter.conversationId = conversationId;
    if (journeyId) filter.journeyId = journeyId;

    const messages = await JourneyAssistantConversation.find(filter)
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      history: messages,
    });
  } catch (error) {
    console.error("Error in journeyAssistantController.getConversationHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation history.",
      error: error.message,
    });
  }
};

/**
 * @desc    Clear Chat History
 * @route   DELETE /api/journey-assistant/history
 * @access  Private
 */
const clearConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.query;
    const filter = { userId: req.user._id };
    if (conversationId) filter.conversationId = conversationId;

    await JourneyAssistantConversation.deleteMany(filter);

    return res.status(200).json({
      success: true,
      message: "Conversation history cleared successfully.",
    });
  } catch (error) {
    console.error("Error in journeyAssistantController.clearConversationHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear conversation history.",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getJourneyContext,
  getConversationHistory,
  clearConversationHistory,
};

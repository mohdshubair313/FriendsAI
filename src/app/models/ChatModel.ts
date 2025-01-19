import mongoose, { Schema, models, model } from 'mongoose';

const chatSchema = new Schema({
    mood: { type: String, required: true },
    userMessage: { type: String, required: true },
    botResponse: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Ensure the Chat model is defined only once
const Chat = models.Chat || model('Chat', chatSchema);

export default Chat;

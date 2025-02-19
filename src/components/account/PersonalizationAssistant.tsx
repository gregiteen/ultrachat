import React, { useEffect, useRef, useState } from 'react';
import { useMessageStore } from '../../store/chat';
import { ChatMessage } from '../ChatMessage';
import { Spinner } from '../../design-system/components/feedback/Spinner';
import { usePersonalizationStore } from '../../store/personalization';
import { gemini } from '../../lib/gemini';
import type { Chat } from '../../lib/gemini';

const SYSTEM_MESSAGE = 
`You are Ultra, an AI assistant focused on helping users fill out their personalization profile. Your primary goal is to gather information for each field in the profile through friendly conversation. Here are the fields you need to fill out:

Required Fields:
1. Name
2. Background/Life Story
3. Interests and Hobbies
4. Areas of Expertise
5. Communication Style
6. Learning Style
7. Work Style
8. Goals and Aspirations

For each field, ask direct but friendly questions like:
- Name: "What should I call you?"
- Background: "Could you tell me about your background and life journey?"
- Interests: "What are your main interests and hobbies?"
- Expertise: "What areas would you consider yourself knowledgeable or skilled in?"
- Communication: "How do you prefer to communicate with others?"
- Learning: "What's your preferred way of learning new things?"
- Work: "How would you describe your work style?"
- Goals: "What are your main goals and aspirations?"

After each user response, update their profile by including a JSON block:

\`\`\`json
{
  "name": "Their name",
  "backstory": "Their background and life story",
  "interests": ["Their interests and hobbies"],
  "expertise_areas": ["Their areas of expertise"],
  "communication_style": "How they prefer to communicate",
  "learning_style": "How they best learn",
  "work_style": "Their approach to work",
  "goals": ["Their goals and aspirations"]
}
\`\`\`

Important Guidelines:
1. Focus on one field at a time
2. Ask follow-up questions to get complete information
3. Confirm the information before moving to the next field
4. Be clear about which field you're working on
5. Keep track of which fields still need to be filled
6. Be friendly but direct in your questions

Your success is measured by how completely you can fill out each field in the profile while maintaining a pleasant conversation.`;

export function PersonalizationAssistant() {
  const { messages, loading: messagesLoading, sendMessage } = useMessageStore();
  const { personalInfo, updatePersonalInfo } = usePersonalizationStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to extract and update profile fields from AI response
  const updateProfileFromResponse = async (response: string) => {
    try {
      // Look for JSON blocks in the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const updates = JSON.parse(jsonMatch[1]);
        
        // Merge arrays instead of replacing them
        const mergedUpdates = {
          ...updates,
          interests: [...new Set([...(personalInfo.interests || []), ...(updates.interests || [])])],
          expertise_areas: [...new Set([...(personalInfo.expertise_areas || []), ...(updates.expertise_areas || [])])],
          goals: [...new Set([...(personalInfo.goals || []), ...(updates.goals || [])])]
        };

        await updatePersonalInfo({
          ...personalInfo,
          ...mergedUpdates
        });
      }
    } catch (error) {
      console.error('Error updating profile from response:', error);
    }
  };

  // Initialize chat
  useEffect(() => {
    const newChat = gemini.startChat(SYSTEM_MESSAGE);
    setChat(newChat);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation if no messages
  useEffect(() => {
    const startConversation = async () => {
      if (messages.length === 0 && !isProcessing) {
        setIsProcessing(true);
        try {
          // Create initial message based on empty fields
          let initialMessage = "Hi! I'm Ultra, and I'm here to help you fill out your personalization profile. ";

          if (!personalInfo.name) {
            initialMessage += "Let's start with your name - what should I call you?";
          } else if (!personalInfo.backstory) {
            initialMessage += `Nice to meet you ${personalInfo.name}! Could you tell me about your background and life journey?`;
          } else if (!personalInfo.interests?.length) {
            initialMessage += "What are your main interests and hobbies?";
          } else if (!personalInfo.expertise_areas?.length) {
            initialMessage += "What areas would you consider yourself knowledgeable or skilled in?";
          } else if (!personalInfo.communication_style) {
            initialMessage += "How do you prefer to communicate with others?";
          } else if (!personalInfo.learning_style) {
            initialMessage += "What's your preferred way of learning new things?";
          } else if (!personalInfo.work_style) {
            initialMessage += "How would you describe your work style?";
          } else if (!personalInfo.goals?.length) {
            initialMessage += "What are your main goals and aspirations?";
          }

          await sendMessage(initialMessage, [], undefined, true);
        } catch (error) {
          console.error('Error starting conversation:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    if (chat) {
      startConversation();
    }
  }, [chat, messages.length, personalInfo, isProcessing, sendMessage]);

  // Handle user input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat || !inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      // Send user message
      await sendMessage(userMessage);
      
      // Get AI response
      const result = await chat.sendMessage(userMessage);
      const response = await result.response.text();
      
      // Update profile fields
      await updateProfileFromResponse(response);
      
      // Send AI response
      await sendMessage(response, [], undefined, true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.id || index}-${message.content}`}
            message={message}
          />
        ))}
        {(messagesLoading || isProcessing) && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-primary" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-muted">
        <form onSubmit={handleSubmit}>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Type your message..."
            disabled={isProcessing}
          />
        </form>
      </div>
    </div>
  );
}
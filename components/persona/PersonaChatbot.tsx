"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, User, X, MessageSquare } from "lucide-react";
import MessageList from "@/components/chat/MessageList";

interface PersonaChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  personaData: any;
  brandId: string;
  productId: string;
  productName: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: any;
}

export function PersonaChatbot({
  isOpen,
  onClose,
  personaData,
  brandId,
  productId,
  productName,
}: PersonaChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset conversation when persona changes
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setConversationId(null);
      setInput("");
    }
  }, [personaData?.persona_name, isOpen]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationId,
          brandId,
          productId,
          chatbotType: "persona",
          personaData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oh, I'm having trouble understanding that. Could you try asking me something else?",
          timestamp: new Date().toISOString(),
          isError: true,
        } as Message,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              {personaData?.image_url ? (
                <img
                  src={personaData.image_url}
                  alt={personaData.persona_name}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              Chat with {personaData?.persona_name || "Customer Persona"}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-6">
                {personaData?.image_url ? (
                  <img
                    src={personaData.image_url}
                    alt={personaData.persona_name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Hi! I'm {personaData?.persona_name || "your customer"}
              </h3>
              <p className="text-gray-600 mb-4 italic">
                "{personaData?.persona_intro || "I use your product regularly."}
                "
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  {personaData?.demographics?.age || "Customer"},{" "}
                  {personaData?.demographics?.job_title || "User"}
                </p>
                <p>
                  {personaData?.demographics?.living_environment ||
                    "Local area"}
                </p>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                <p>
                  Ask me about my experience with {productName}, my daily
                  routine, or what matters to me!
                </p>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${personaData?.persona_name || "me"} a question...`}
            className="w-full p-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="absolute bottom-2 right-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

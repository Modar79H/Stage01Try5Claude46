"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Edit2,
  Check,
  X,
  History,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MessageList from "@/components/chat/MessageList";
import SuggestedPrompts from "@/components/chat/SuggestedPrompts";
import ConversationList from "@/components/chat/ConversationList";

interface ProductImprovementStrategistProps {
  brandId: string;
  productId: string;
  brandName: string;
  productName: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: any;
}

export function ProductImprovementStrategist({
  brandId,
  productId,
  brandName,
  productName,
}: ProductImprovementStrategistProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState(
    "New Product Improvement Strategy",
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showConversations, setShowConversations] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load smart suggestions when component mounts or product changes
    loadSuggestions();
  }, [productId]);

  const loadSuggestions = async () => {
    // Default product improvement suggestions
    setSuggestions([
      "What are the top 3 product issues customers are complaining about?",
      "Create a prioritized list of product improvements based on customer feedback",
      "What quality issues are mentioned most frequently in reviews?",
      "How can we improve the user experience based on customer pain points?",
    ]);
  };

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
          chatbotType: "product-improvement",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update conversation ID and title if new
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
          content: "I apologize, but I encountered an error. Please try again.",
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

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setConversationTitle("New Product Improvement Strategy");
    setShowConversations(false);
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/history?conversationId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setConversationId(id);
        setConversationTitle(data.title || "Product Improvement Strategy");
        setShowConversations(false);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const updateTitle = async () => {
    if (!conversationId || !editedTitle.trim()) return;

    try {
      const response = await fetch(`/api/chat/${conversationId}/title`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editedTitle }),
      });

      if (response.ok) {
        setConversationTitle(editedTitle);
        setIsEditingTitle(false);
      }
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isExpanded
          ? "fixed inset-4 z-50 flex flex-col"
          : "relative hover:shadow-lg",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            <CardTitle>Product Improvement Strategist</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConversations(!showConversations)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2 flex-1">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={updateTitle}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingTitle(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  {conversationTitle}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedTitle(conversationTitle);
                    setIsEditingTitle(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={startNewConversation}>
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-col",
          isExpanded ? "flex-1 overflow-hidden" : "h-[500px]",
        )}
      >
        {showConversations ? (
          <ConversationList
            onSelectConversation={loadConversation}
            onClose={() => setShowConversations(false)}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-orange-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Product Improvement Strategist
                  </h3>
                  <p className="text-gray-600 mb-6">
                    I analyze customer feedback to help you prioritize and
                    implement product improvements that matter most.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Ask me about product issues, quality improvements, or
                      feature requests
                    </p>
                  </div>
                </div>
              ) : (
                <MessageList messages={messages} />
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && suggestions.length > 0 && (
              <SuggestedPrompts
                prompts={suggestions}
                onSelectPrompt={handleSend}
              />
            )}

            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about product improvements..."
                className="w-full p-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute bottom-2 right-2 bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

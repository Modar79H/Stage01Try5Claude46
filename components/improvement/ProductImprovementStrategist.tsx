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
        throw new Error("Unable to send message at this time");
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
    <Card className="mt-8 border-2 border-primary/20 shadow-lg min-w-[500px]">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Product Improvement Strategist
                <span className="text-sm font-normal text-muted-foreground">
                  Powered by GPT-4
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Get personalized product improvement advice based on your
                customer data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              title="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConversations(!showConversations)}
              title="Chat History"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            isExpanded ? "h-[700px]" : "h-[500px]",
          )}
        >
          <div className="h-full flex flex-col">
            {/* Conversation Title Bar */}
            {conversationId && (
              <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded-md"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={updateTitle}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingTitle(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{conversationTitle}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditedTitle(conversationTitle);
                        setIsEditingTitle(true);
                      }}
                      className="h-6 w-6"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {productName}
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {showConversations ? (
                <ConversationList
                  onSelect={loadConversation}
                  onNew={startNewConversation}
                  brandId={brandId}
                  productId={productId}
                />
              ) : messages.length === 0 ? (
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      🔧 Welcome to Your Product Improvement Strategist!
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      I have access to all your customer analyses for{" "}
                      <strong>{productName}</strong>. I can help you prioritize
                      product improvements, identify quality issues, and provide
                      actionable recommendations based on your actual customer
                      feedback.
                    </p>
                  </div>

                  <SuggestedPrompts
                    prompts={suggestions}
                    onSelect={handleSend}
                  />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  messagesEndRef={messagesEndRef}
                />
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize textarea based on content
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask about product improvements, quality issues, or feature requests..."
                  className="flex-1 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px] max-h-[120px] resize-none overflow-y-auto"
                  disabled={isLoading}
                  rows={1}
                  style={{ height: '44px' }}
                />
                <Button
                  onClick={() => handleSend(input)}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

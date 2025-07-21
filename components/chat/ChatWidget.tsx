"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Download, Maximize2, Minimize2 } from "lucide-react";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import SuggestedPrompts from "./SuggestedPrompts";
import ConversationList from "./ConversationList";

interface ChatWidgetProps {
  brandId?: string;
  productId?: string;
  brandName?: string;
  productName?: string;
}

export default function ChatWidget({
  brandId,
  productId,
  brandName,
  productName,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !conversationId) {
      loadSuggestions();
    }
  }, [isOpen, brandId, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSuggestions = async () => {
    try {
      const params = new URLSearchParams();
      if (brandId) params.append("brandId", brandId);
      if (productId) params.append("productId", productId);

      const response = await fetch(`/api/chat/suggestions?${params}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message to UI
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message,
          brandId,
          productId,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle JSON response (non-streaming)
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message
      const assistantMessage = {
        role: "assistant" as const,
        content:
          data.message || "I apologize, but I couldn't generate a response.",
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggestions if provided
      if (data.metadata?.suggestedPrompts) {
        setSuggestions(data.metadata.suggestedPrompts);
      }

      // Set conversation ID if provided
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/chat/export?conversationId=${conversationId}`,
      );

      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing-strategy-${conversationId}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setConversationId(convId);
    setShowConversations(false);

    // Load conversation history
    try {
      const response = await fetch(
        `/api/chat/history?conversationId=${convId}`,
      );
      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    loadSuggestions();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-50"
        title="Customer Support Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className={`fixed ${
        isFullscreen
          ? "inset-0"
          : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]"
      } z-50 transition-all duration-300`}
    >
      <Card className="h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} />
            <div>
              <h3 className="font-semibold">Customer Support</h3>
              <p className="text-xs opacity-90">How can we help you today?</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {conversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportConversation}
                className="text-white hover:bg-white/20"
                title="Export conversation"
              >
                <Download size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {showConversations ? (
            <ConversationList
              onSelect={handleSelectConversation}
              onClose={() => setShowConversations(false)}
              currentConversationId={conversationId}
            />
          ) : (
            <>
              {/* Messages */}
              <MessageList
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />

              {/* Suggested Prompts */}
              {messages.length === 0 && suggestions.length > 0 && (
                <SuggestedPrompts
                  prompts={suggestions}
                  onSelect={handleSendMessage}
                />
              )}

              {/* Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onNewConversation={handleNewConversation}
                onShowConversations={() => setShowConversations(true)}
                hasConversation={!!conversationId}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

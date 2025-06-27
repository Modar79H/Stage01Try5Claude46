"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Plus, MessageSquare } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onNewConversation: () => void;
  onShowConversations: () => void;
  hasConversation: boolean;
}

export default function ChatInput({
  onSendMessage,
  isLoading,
  onNewConversation,
  onShowConversations,
  hasConversation,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNewConversation}
          className="text-xs"
        >
          <Plus size={14} className="mr-1" />
          New Chat
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onShowConversations}
          className="text-xs"
        >
          <MessageSquare size={14} className="mr-1" />
          History
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your customers, marketing strategies, or product insights..."
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isLoading}
          className="px-3"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
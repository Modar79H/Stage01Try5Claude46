"use client";

import { useEffect, useState } from "react";
import { User, Bot, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedMessage } from "./EnhancedMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: any;
  isError?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({
  messages,
  isLoading,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Welcome to Customer Support!</p>
          <p className="text-sm mt-2">
            I'm here to help you with any questions about our platform,
            features, or how to get the most out of your customer review
            analyses.
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-start space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [displayContent, setDisplayContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isUser && message.content) {
      // Simulate typing effect for assistant messages
      setIsTyping(true);
      let index = 0;
      const typingSpeed = 10; // ms per character

      const typeWriter = () => {
        if (index < message.content.length) {
          setDisplayContent(message.content.substring(0, index + 1));
          index++;
          setTimeout(typeWriter, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };

      // Skip typing animation if message is too long
      if (message.content.length > 500) {
        setDisplayContent(message.content);
        setIsTyping(false);
      } else {
        typeWriter();
      }
    } else {
      setDisplayContent(message.content);
    }
  }, [message.content, isUser]);

  return (
    <div
      className={cn(
        "flex items-start space-x-2",
        isUser && "flex-row-reverse space-x-reverse",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-blue-500 text-white" : "bg-primary/10",
        )}
      >
        {isUser ? (
          <User size={16} />
        ) : message.isError ? (
          <AlertCircle size={16} className="text-red-500" />
        ) : (
          <Bot size={16} className="text-primary" />
        )}
      </div>

      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser
            ? "bg-blue-500 text-white"
            : message.isError
              ? "bg-red-50 text-red-900"
              : "bg-muted",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{displayContent}</p>
        ) : (
          <EnhancedMessage
            content={displayContent}
            role={message.role}
            className={message.isError ? "text-red-900" : ""}
          />
        )}

        {message.metadata?.sources && (
          <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-70">
            Sources: {message.metadata.sources.join(", ")}
          </div>
        )}

        {message.timestamp && (
          <p className="text-xs opacity-60 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

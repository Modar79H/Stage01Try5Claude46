"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Plus, MessageSquare, X } from "lucide-react";
import { ProductAutoComplete } from "./ProductAutoComplete";
import { Product } from "@prisma/client";

interface ChatInputProps {
  onSendMessage: (message: string, mentionedProducts?: Product[]) => void;
  isLoading: boolean;
  onNewConversation: () => void;
  onShowConversations: () => void;
  hasConversation: boolean;
  brandId: string;
}

interface MentionedProduct extends Product {
  brand?: {
    id: string;
    name: string;
  };
}

export default function ChatInput({
  onSendMessage,
  isLoading,
  onNewConversation,
  onShowConversations,
  hasConversation,
  brandId,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [mentionedProducts, setMentionedProducts] = useState<
    MentionedProduct[]
  >([]);
  const [autoCompleteState, setAutoCompleteState] = useState({
    isVisible: false,
    searchTerm: "",
    position: { top: 0, left: 0 },
    cursorPosition: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`;
    }
  }, [message]);

  // Detect @mentions and show autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessage(value);

    // Check for @ symbol before cursor
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Only show autocomplete if there's no space after @
      if (!textAfterAt.includes(" ") && textAfterAt.length >= 0) {
        const textarea = textareaRef.current;
        if (textarea && containerRef.current) {
          // Calculate position for autocomplete dropdown
          const rect = textarea.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          setAutoCompleteState({
            isVisible: true,
            searchTerm: textAfterAt,
            position: {
              top: rect.bottom - containerRect.top + 5,
              left: rect.left - containerRect.left + lastAtIndex * 8, // Approximate character width
            },
            cursorPosition: cursorPos,
          });
          return;
        }
      }
    }

    // Hide autocomplete if no @ found or space after @
    if (autoCompleteState.isVisible) {
      setAutoCompleteState((prev) => ({ ...prev, isVisible: false }));
    }
  };

  const handleProductSelect = (product: MentionedProduct) => {
    const { cursorPosition } = autoCompleteState;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = textBeforeCursor.substring(0, lastAtIndex);
      const newMessage = `${beforeAt}@${product.name} ${textAfterCursor}`;
      setMessage(newMessage);

      // Add to mentioned products if not already included
      if (!mentionedProducts.find((p) => p.id === product.id)) {
        setMentionedProducts((prev) => [...prev, product]);
      }
    }

    setAutoCompleteState((prev) => ({ ...prev, isVisible: false }));
    textareaRef.current?.focus();
  };

  const removeMentionedProduct = (productId: string) => {
    setMentionedProducts((prev) => prev.filter((p) => p.id !== productId));
    // Also remove from message
    const productToRemove = mentionedProducts.find((p) => p.id === productId);
    if (productToRemove) {
      const newMessage = message
        .replace(`@${productToRemove.name}`, "")
        .replace(/\s+/g, " ")
        .trim();
      setMessage(newMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message, mentionedProducts);
      setMessage("");
      setMentionedProducts([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle Enter if autocomplete is visible - let it handle navigation
    if (autoCompleteState.isVisible) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div ref={containerRef} className="border-t p-4 relative">
      {/* Mentioned Products Pills */}
      {mentionedProducts.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Currently discussing:
          </p>
          <div className="flex flex-wrap gap-2">
            {mentionedProducts.map((product) => (
              <div
                key={product.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
              >
                <span>@{product.name}</span>
                <button
                  onClick={() => removeMentionedProduct(product.id)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              mentionedProducts.length > 0
                ? `Ask about ${mentionedProducts.map((p) => p.name).join(", ")} or type @ to mention other products...`
                : "Ask about your brand or type @ to mention specific products..."
            }
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            disabled={isLoading}
          />

          <ProductAutoComplete
            brandId={brandId}
            searchTerm={autoCompleteState.searchTerm}
            position={autoCompleteState.position}
            isVisible={autoCompleteState.isVisible}
            onSelect={handleProductSelect}
            onClose={() =>
              setAutoCompleteState((prev) => ({ ...prev, isVisible: false }))
            }
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isLoading}
          className="px-3"
        >
          <Send size={16} />
        </Button>
      </form>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground">
        <p>
          💡 Type <code className="bg-muted px-1 py-0.5 rounded">@</code> to
          mention specific products in your conversation
        </p>
      </div>
    </div>
  );
}

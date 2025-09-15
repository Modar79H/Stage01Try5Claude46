"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ChevronLeft,
  Archive,
  Calendar,
  Package,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  brand?: { name: string };
  product?: { name: string };
  createdAt: string;
  updatedAt: string;
  messages: any[];
}

interface ConversationListProps {
  onSelect: (conversationId: string) => void;
  onClose?: () => void;
  onNew?: () => void;
  currentConversationId?: string | null;
  brandId?: string;
  productId?: string;
}

export default function ConversationList({
  onSelect,
  onClose,
  onNew,
  currentConversationId,
  brandId,
  productId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/history?conversationId=${conversationId}`, {
        method: "DELETE",
      });
      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center space-x-2">
          <MessageSquare size={20} />
          <span>Conversation History</span>
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm mt-2">
              Start a new chat to begin getting marketing insights!
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                  currentConversationId === conversation.id && "bg-muted",
                )}
                onClick={() => onSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {conversation.title}
                    </h4>

                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      {conversation.brand && (
                        <span className="flex items-center space-x-1">
                          <Building2 size={12} />
                          <span className="truncate">
                            {conversation.brand.name}
                          </span>
                        </span>
                      )}
                      {conversation.product && (
                        <span className="flex items-center space-x-1">
                          <Package size={12} />
                          <span className="truncate">
                            {conversation.product.name}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(conversation.updatedAt)}</span>
                      </span>
                    </div>

                    {conversation.messages[0] && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {conversation.messages[0].content}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(conversation.id);
                    }}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    title="Archive conversation"
                  >
                    <Archive size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MentionUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useMention() {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not("username", "is", null)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching users:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((text: string, cursorPosition: number) => {
    // Find if we're in a mention context
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionPosition(cursorPosition - query.length - 1);

      // Debounce the search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        searchUsers(query);
      }, 200);
    } else {
      setMentionQuery("");
      setMentionPosition(null);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [searchUsers]);

  const handleSelectUser = useCallback((username: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionQuery("");
    setMentionPosition(null);
  }, []);

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    mentionQuery,
    mentionPosition,
    suggestions,
    loading,
    showSuggestions,
    handleInputChange,
    handleSelectUser,
    closeSuggestions,
  };
}

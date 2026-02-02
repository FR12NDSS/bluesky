import { Loader2 } from "lucide-react";

interface MentionUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface MentionSuggestionsProps {
  suggestions: MentionUser[];
  loading: boolean;
  onSelect: (username: string) => void;
  onClose: () => void;
}

export function MentionSuggestions({
  suggestions,
  loading,
  onSelect,
  onClose,
}: MentionSuggestionsProps) {
  if (loading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover p-3 shadow-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">กำลังค้นหา...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover p-3 shadow-lg">
        <p className="text-sm text-muted-foreground text-center">ไม่พบผู้ใช้</p>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
      {suggestions.map((user) => (
        <button
          key={user.user_id}
          onClick={() => user.username && onSelect(user.username)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || ""}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(user.display_name || user.username || "?").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{user.username}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

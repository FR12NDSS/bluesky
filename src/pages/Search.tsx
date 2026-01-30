import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Users, FileText, TrendingUp, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/post";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useTrendingHashtags } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";

export default function Search() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"users" | "posts">("posts");
  
  const { users, posts, loading, searchUsers, searchPosts, searchByHashtag } = useSearch();
  const { hashtags: trendingHashtags, loading: trendingLoading } = useTrendingHashtags();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      if (q.startsWith("#")) {
        searchByHashtag(q);
        setActiveTab("posts");
      } else {
        if (activeTab === "users") {
          searchUsers(q);
        } else {
          searchPosts(q);
        }
      }
    }
  }, [searchParams, activeTab, searchUsers, searchPosts, searchByHashtag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  const handleHashtagClick = (tag: string) => {
    setQuery(tag);
    setSearchParams({ q: tag });
    setActiveTab("posts");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "users" | "posts");
    if (query.trim()) {
      if (value === "users") {
        searchUsers(query);
      } else {
        searchPosts(query);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-foreground">ค้นหา</h1>
        </div>
      </header>

      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหาผู้ใช้หรือโพสต์..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </form>
      </div>

      {/* Trending Hashtags */}
      {!query && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">กำลังมาแรง</h2>
          </div>
          
          {trendingLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trendingHashtags.length > 0 ? (
            <div className="space-y-3">
              {trendingHashtags.map((hashtag, index) => (
                <button
                  key={hashtag.id}
                  onClick={() => handleHashtagClick(hashtag.tag)}
                  className="flex items-start gap-3 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-muted-foreground text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{hashtag.tag}</p>
                    <p className="text-sm text-muted-foreground">
                      {hashtag.post_count.toLocaleString()} โพสต์
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              ยังไม่มี hashtag ที่กำลังมาแรง
            </p>
          )}
        </div>
      )}

      {/* Search Results */}
      {query && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="posts"
              className={cn(
                "flex-1 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              )}
            >
              <FileText className="h-4 w-4 mr-2" />
              โพสต์
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className={cn(
                "flex-1 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              ผู้ใช้
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="m-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      name: post.author?.display_name || "ผู้ใช้",
                      handle: `@${post.author?.username || "user"}`,
                      avatar: post.author?.avatar_url,
                    }}
                    content={post.content}
                    image={post.image_url}
                    createdAt={new Date(post.created_at)}
                    likes={post.likes_count}
                    comments={post.comments_count}
                    reposts={post.reposts_count}
                    isLiked={post.is_liked}
                    isReposted={post.is_reposted}
                    isOwner={post.user_id === user?.id}
                    onLike={() => {}}
                    onComment={() => {}}
                    onRepost={() => {}}
                    onShare={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">ไม่พบโพสต์ที่ตรงกับ "{query}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="m-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length > 0 ? (
              <div>
                {users.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => navigate(`/profile/${u.user_id}`)}
                    className="flex items-center gap-3 w-full p-4 border-b border-border hover:bg-muted/30 transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(u.display_name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {u.display_name || "ผู้ใช้"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{u.username || "user"}
                      </p>
                      {u.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">ไม่พบผู้ใช้ที่ตรงกับ "{query}"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
}

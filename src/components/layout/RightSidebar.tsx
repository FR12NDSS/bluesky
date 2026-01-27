import { TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const trendingTopics = [
  { tag: "#ท้องฟ้าไทย", posts: "1.2K" },
  { tag: "#เทคโนโลยี", posts: "856" },
  { tag: "#กรุงเทพ", posts: "654" },
  { tag: "#อาหารไทย", posts: "432" },
  { tag: "#ท่องเที่ยว", posts: "321" },
];

const suggestedUsers = [
  { name: "สมชาย ใจดี", handle: "@somchai", avatar: null },
  { name: "มาลี รักษ์โลก", handle: "@malee_eco", avatar: null },
  { name: "วิทยา เทคโน", handle: "@wittaya_tech", avatar: null },
];

export function RightSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 flex-col gap-4 overflow-y-auto p-4 lg:flex">
      {/* Trending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            กำลังมาแรง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <button
              key={topic.tag}
              className="flex w-full flex-col items-start rounded-lg p-2 text-left transition-colors hover:bg-muted"
            >
              <span className="text-xs text-muted-foreground">
                อันดับ {index + 1} · กำลังมาแรง
              </span>
              <span className="font-semibold text-foreground">{topic.tag}</span>
              <span className="text-sm text-muted-foreground">
                {topic.posts} โพสต์
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            แนะนำให้ติดตาม
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedUsers.map((user) => (
            <div
              key={user.handle}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.handle}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                ติดตาม
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-auto text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">
            เงื่อนไขการใช้งาน
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            นโยบายความเป็นส่วนตัว
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            เกี่ยวกับเรา
          </a>
        </div>
        <p className="mt-2">© 2024 ท้องฟ้า</p>
      </div>
    </aside>
  );
}

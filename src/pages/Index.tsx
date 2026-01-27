import { MainLayout } from "@/components/layout";
import { ComposePost } from "@/components/post";
import { PostCard } from "@/components/post";

// Mock data for demonstration
const mockPosts = [
  {
    id: "1",
    author: {
      name: "สมชาย ใจดี",
      handle: "@somchai",
      avatar: null,
    },
    content: "วันนี้อากาศดีมาก ออกไปเดินเล่นที่สวนลุมพินีมา สบายใจสุดๆ 🌤️ #กรุงเทพ #สวนลุมพินี",
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    likes: 24,
    comments: 5,
    reposts: 3,
    isLiked: false,
    isReposted: false,
  },
  {
    id: "2",
    author: {
      name: "มาลี รักษ์โลก",
      handle: "@malee_eco",
      avatar: null,
    },
    content: "เพิ่งอ่านบทความเรื่องการลดขยะพลาสติกมา น่าสนใจมากค่ะ เราทุกคนสามารถช่วยกันได้ง่ายๆ เริ่มจากการพกถุงผ้าไปซื้อของ 🌱♻️\n\nใครมีเทคนิคลดขยะดีๆ มาแชร์กันค่ะ!",
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 156,
    comments: 32,
    reposts: 45,
    isLiked: true,
    isReposted: false,
  },
  {
    id: "3",
    author: {
      name: "วิทยา เทคโน",
      handle: "@wittaya_tech",
      avatar: null,
    },
    content: "ทดลองใช้ AI ช่วยเขียนโค้ดมาหลายวัน ต้องบอกว่าประทับใจมาก productivity เพิ่มขึ้นเยอะเลย 🚀\n\n#AI #Programming #Developer",
    image: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    likes: 89,
    comments: 21,
    reposts: 12,
    isLiked: false,
    isReposted: true,
  },
];

const Index = () => {
  return (
    <MainLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-foreground">หน้าแรก</h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button className="flex-1 py-3 text-center font-medium text-primary transition-colors hover:bg-muted">
            <span className="relative">
              สำหรับคุณ
              <span className="absolute -bottom-3 left-0 right-0 h-1 rounded-full bg-primary" />
            </span>
          </button>
          <button className="flex-1 py-3 text-center font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            กำลังติดตาม
          </button>
        </div>
      </header>

      {/* Compose Post */}
      <ComposePost
        userName="ผู้ใช้"
        onSubmit={(content, image) => {
          console.log("New post:", content, image);
        }}
      />

      {/* Feed */}
      <div>
        {mockPosts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            onLike={() => console.log("Like:", post.id)}
            onComment={() => console.log("Comment:", post.id)}
            onRepost={() => console.log("Repost:", post.id)}
            onShare={() => console.log("Share:", post.id)}
          />
        ))}
      </div>
    </MainLayout>
  );
};

export default Index;

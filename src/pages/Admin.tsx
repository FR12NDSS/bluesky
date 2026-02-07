import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2, Users, FileText, MessageSquare, Heart, Shield, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export default function Admin() {
  const {
    isAdmin,
    isCheckingAdmin,
    stats,
    isLoadingStats,
    users,
    isLoadingUsers,
    posts,
    isLoadingPosts,
    comments,
    isLoadingComments,
    setUserRole,
    deletePost,
    deleteComment,
  } = useAdmin();

  if (isCheckingAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const statCards = [
    { label: "ผู้ใช้ทั้งหมด", value: stats?.total_users || 0, icon: Users, color: "text-blue-500" },
    { label: "โพสต์ทั้งหมด", value: stats?.total_posts || 0, icon: FileText, color: "text-green-500" },
    { label: "ความคิดเห็น", value: stats?.total_comments || 0, icon: MessageSquare, color: "text-orange-500" },
    { label: "ถูกใจ", value: stats?.total_likes || 0, icon: Heart, color: "text-red-500" },
  ];

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">แอดมิน</Badge>;
      case "moderator":
        return <Badge variant="secondary">ผู้ดูแล</Badge>;
      default:
        return <Badge variant="outline">ผู้ใช้</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">แผงควบคุมแอดมิน</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? "-" : stat.value.toLocaleString()}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today Stats */}
      <div className="px-4 pb-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">วันนี้</p>
            <div className="flex gap-6">
              <div>
                <span className="text-lg font-semibold">{stats?.users_today || 0}</span>
                <span className="text-sm text-muted-foreground ml-1">ผู้ใช้ใหม่</span>
              </div>
              <div>
                <span className="text-lg font-semibold">{stats?.posts_today || 0}</span>
                <span className="text-sm text-muted-foreground ml-1">โพสต์ใหม่</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="px-4 pb-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="users">ผู้ใช้</TabsTrigger>
          <TabsTrigger value="posts">โพสต์</TabsTrigger>
          <TabsTrigger value="comments">คอมเม้น</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-3">
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            users?.map((user) => (
              <Card key={user.user_id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{(user.display_name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{user.display_name || "ไม่มีชื่อ"}</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @{user.username || "ไม่มี username"}
                      </p>
                    </div>
                    <Select
                      value={user.role || "user"}
                      onValueChange={(role) =>
                        setUserRole.mutate({ userId: user.user_id, role: role as "admin" | "moderator" | "user" })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">ผู้ใช้</SelectItem>
                        <SelectItem value="moderator">ผู้ดูแล</SelectItem>
                        <SelectItem value="admin">แอดมิน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-3">
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            posts?.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback>{(post.author?.display_name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{post.author?.display_name || "ไม่มีชื่อ"}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: th })}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ลบโพสต์นี้?</AlertDialogTitle>
                              <AlertDialogDescription>
                                การดำเนินการนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePost.mutate(post.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                ลบ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-4 space-y-3">
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            comments?.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author?.avatar_url || undefined} />
                      <AvatarFallback>{(comment.author?.display_name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{comment.author?.display_name || "ไม่มีชื่อ"}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ลบความคิดเห็นนี้?</AlertDialogTitle>
                              <AlertDialogDescription>
                                การดำเนินการนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteComment.mutate(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                ลบ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

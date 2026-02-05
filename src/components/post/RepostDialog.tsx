 import { useState } from "react";
 import { Repeat2, Loader2 } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 
 interface RepostDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   postAuthor: {
     name: string;
     handle: string;
     avatar?: string | null;
   };
   postContent: string;
   isReposted: boolean;
   onRepost: () => void;
   onQuoteRepost?: (content: string) => void;
 }
 
 export function RepostDialog({
   open,
   onOpenChange,
   postAuthor,
   postContent,
   isReposted,
   onRepost,
   onQuoteRepost,
 }: RepostDialogProps) {
   const [quoteContent, setQuoteContent] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showQuote, setShowQuote] = useState(false);
 
   const handleRepost = async () => {
     setIsSubmitting(true);
     await onRepost();
     setIsSubmitting(false);
     onOpenChange(false);
   };
 
   const handleQuoteRepost = async () => {
     if (!quoteContent.trim() || !onQuoteRepost) return;
     setIsSubmitting(true);
     await onQuoteRepost(quoteContent.trim());
     setIsSubmitting(false);
     setQuoteContent("");
     setShowQuote(false);
     onOpenChange(false);
   };
 
   const handleClose = (open: boolean) => {
     if (!open) {
       setShowQuote(false);
       setQuoteContent("");
     }
     onOpenChange(open);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Repeat2 className="h-5 w-5" />
             {isReposted ? "ยกเลิกรีโพสต์" : "รีโพสต์"}
           </DialogTitle>
         </DialogHeader>
 
         {!showQuote ? (
           <div className="space-y-3">
             {/* Repost Option */}
             <button
               onClick={handleRepost}
               disabled={isSubmitting}
               className="flex w-full items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
             >
               {isSubmitting ? (
                 <Loader2 className="h-5 w-5 animate-spin" />
               ) : (
                 <Repeat2 className="h-5 w-5" />
               )}
               <div className="text-left">
                 <p className="font-medium">
                   {isReposted ? "ยกเลิกรีโพสต์" : "รีโพสต์"}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   {isReposted 
                     ? "ลบรีโพสต์ของคุณออก" 
                     : "แชร์โพสต์นี้ให้ผู้ติดตามของคุณ"}
                 </p>
               </div>
             </button>
 
             {/* Quote Repost Option */}
             {!isReposted && onQuoteRepost && (
               <button
                 onClick={() => setShowQuote(true)}
                 className="flex w-full items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
               >
                 <svg
                   className="h-5 w-5"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                 >
                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                 </svg>
                 <div className="text-left">
                   <p className="font-medium">โควตรีโพสต์</p>
                   <p className="text-sm text-muted-foreground">
                     เพิ่มความคิดเห็นของคุณก่อนแชร์
                   </p>
                 </div>
               </button>
             )}
           </div>
         ) : (
           <div className="space-y-4">
             {/* Quote Input */}
             <Textarea
               placeholder="เพิ่มความคิดเห็นของคุณ..."
               value={quoteContent}
               onChange={(e) => setQuoteContent(e.target.value)}
               className="min-h-[100px] resize-none"
               maxLength={300}
             />
 
             {/* Original Post Preview */}
             <div className="rounded-lg border border-border bg-muted/30 p-3">
               <div className="flex items-center gap-2 text-sm">
                 {postAuthor.avatar ? (
                   <img
                     src={postAuthor.avatar}
                     alt={postAuthor.name}
                     className="h-5 w-5 rounded-full object-cover"
                   />
                 ) : (
                   <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                     {postAuthor.name.charAt(0)}
                   </div>
                 )}
                 <span className="font-medium text-foreground">
                   {postAuthor.name}
                 </span>
                 <span className="text-muted-foreground">{postAuthor.handle}</span>
               </div>
               <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                 {postContent}
               </p>
             </div>
 
             {/* Actions */}
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => setShowQuote(false)}
                 disabled={isSubmitting}
               >
                 ย้อนกลับ
               </Button>
               <Button
                 onClick={handleQuoteRepost}
                 disabled={!quoteContent.trim() || isSubmitting}
               >
                 {isSubmitting ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                   <Repeat2 className="mr-2 h-4 w-4" />
                 )}
                 โควตรีโพสต์
               </Button>
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }
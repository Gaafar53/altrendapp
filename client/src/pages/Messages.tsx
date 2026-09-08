import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, ArrowRight, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function Messages() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convosLoading, refetch: refetchConvos } = trpc.message.conversations.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  const { data: msgs, isLoading: msgsLoading, refetch: refetchMsgs } = trpc.message.getMessages.useQuery(
    { conversationId: selectedConvoId! },
    { enabled: !!selectedConvoId, refetchInterval: 3000 }
  );

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMsgs();
      refetchConvos();
    },
  });

  const selectedConvo = useMemo(() => conversations?.find(c => c.id === selectedConvoId), [conversations, selectedConvoId]);

  const reversedMsgs = useMemo(() => msgs ? [...msgs].reverse() : [], [msgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reversedMsgs]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <MessageCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">سجّل دخولك لعرض الرسائل</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>تسجيل الدخول</Button>
      </div>
    );
  }

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvo) return;
    sendMutation.mutate({ toUserId: selectedConvo.otherUser.id, content: messageText.trim() });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          الرسائل الخاصة
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col overflow-hidden border-border/50">
            <div className="p-3 border-b border-border/50 bg-muted/30">
              <h3 className="font-semibold text-foreground text-sm">المحادثات</h3>
            </div>
            <ScrollArea className="flex-1">
              {convosLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
              ) : !conversations?.length ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  لا توجد محادثات بعد
                </div>
              ) : (
                conversations.map(convo => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvoId(convo.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/20 text-right ${
                      selectedConvoId === convo.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={convo.otherUser.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(convo.otherUser.name ?? "م")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground text-sm truncate">
                          {convo.otherUser.name ?? "مستخدم"}
                        </span>
                        {convo.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {convo.lastMessage || "ابدأ المحادثة..."}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden border-border/50">
            {!selectedConvoId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <MessageCircle className="h-12 w-12" />
                <p className="text-sm">اختر محادثة للبدء</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-border/50 bg-muted/30 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedConvoId(null)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {selectedConvo && (
                    <>
                      <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate(`/profile/${selectedConvo.otherUser.id}`)}>
                        <AvatarImage src={selectedConvo.otherUser.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {(selectedConvo.otherUser.name ?? "م")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/profile/${selectedConvo.otherUser.id}`)}
                      >
                        {selectedConvo.otherUser.name ?? "مستخدم"}
                      </span>
                    </>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {msgsLoading ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                  ) : reversedMsgs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      ابدأ المحادثة بإرسال رسالة
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reversedMsgs.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ar })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border/50 bg-muted/20">
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-background border-border/50"
                      disabled={sendMutation.isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageText.trim() || sendMutation.isPending}
                      className="shrink-0"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

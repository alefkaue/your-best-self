import { ArrowLeft, Send, ImageIcon, Bot, User as UserIcon, Loader2, X } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { url: string; type: string; name: string }[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Assistente() {
  const { user, isReady } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! 👋 Sou seu assistente de fitness e nutrição com IA. Posso te ajudar com:\n\n- 🏋️ Montar treinos personalizados\n- 🍽️ Analisar fotos de pratos (calorias)\n- 💊 Dicas de suplementação\n- 🔍 Identificar equipamentos\n- 📊 Dicas de saúde e bem-estar\n\nComo posso te ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const uploadAttachment = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    setIsLoading(true);

    const uploadedAttachments: { url: string; type: string; name: string }[] = [];
    for (const att of attachments) {
      try {
        const url = await uploadAttachment(att.file);
        uploadedAttachments.push({ url, type: att.file.type, name: att.file.name });
      } catch {
        toast.error("Erro ao enviar arquivo");
      }
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: uploadedAttachments,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);

    try {
      const apiMessages = newMessages.map((m) => {
        if (m.attachments?.length) {
          const content: any[] = [];
          if (m.content) content.push({ type: "text", text: m.content });
          m.attachments.forEach((att) => {
            if (att.type.startsWith("image/")) {
              content.push({ type: "image_url", image_url: { url: att.url } });
            }
          });
          return { role: m.role, content };
        }
        return { role: m.role, content: m.content };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro na IA");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newMessages.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao se comunicar com a IA");
      setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
    }

    setIsLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <div className="px-4 pt-6 pb-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold font-display text-foreground">Assistente IA</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2 animate-slide-up", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card shadow-card text-foreground rounded-bl-sm")}>
              {msg.attachments?.map((att, j) => (
                att.type.startsWith("image/") && (
                  <img key={j} src={att.url} alt={att.name} className="rounded-lg mb-2 max-w-full" loading="lazy" />
                )
              ))}
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                <UserIcon className="h-4 w-4 text-accent" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
            <div className="bg-card shadow-card rounded-2xl rounded-bl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-border bg-card">
          {attachments.map((att, i) => (
            <div key={i} className="relative shrink-0">
              <img src={att.preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card flex gap-2 items-end">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} multiple />
        <Button size="icon" variant="ghost" onClick={() => imageInputRef.current?.click()} className="shrink-0 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Pergunte algo..."
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={isLoading} className="shrink-0 gradient-primary text-primary-foreground">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

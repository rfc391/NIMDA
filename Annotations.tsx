import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Reply, UserCircle, PencilLine } from "lucide-react";

interface AnnotationProps {
  intelligenceId: number;
  content: string;
}

export default function Annotations({ intelligenceId, content }: AnnotationProps) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set<string>());
  const contentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { sendMessage, subscribe, startTyping, stopTyping } = useWebSocket();

  const { data: annotations } = useQuery({
    queryKey: [`/api/intelligence/${intelligenceId}/annotations`],
  });

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === "annotation_created" && message.data.intelligenceId === intelligenceId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/intelligence/${intelligenceId}/annotations`] 
        });
        toast({
          title: "New Annotation",
          description: `${message.data.username} added an annotation`,
        });
      } else if (message.type === "typing_start" && 
                message.data.type === "annotation" && 
                message.data.id === intelligenceId) {
        setTypingUsers((prev) => new Set([...Array.from(prev), message.data.username]));
      } else if (message.type === "typing_end" && 
                message.data.type === "annotation" && 
                message.data.id === intelligenceId) {
        setTypingUsers((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(message.data.username);
          return newSet;
        });
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [subscribe, queryClient, toast, intelligenceId]);

  const createAnnotationMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      startOffset: number;
      endOffset: number;
      parentId?: number;
    }) => {
      const res = await fetch(`/api/intelligence/${intelligenceId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/intelligence/${intelligenceId}/annotations`] 
      });
      toast({ title: "Success", description: "Annotation created" });
      setNewAnnotation("");
      setSelection(null);
      setReplyTo(null);

      // Notify other users
      sendMessage({
        type: "annotation_created",
        data: {
          username: user?.username,
          intelligenceId,
        },
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (!selection || !contentRef.current) return;

      const range = selection.getRangeAt(0);
      const content = contentRef.current.textContent || "";
      
      if (range.toString().trim()) {
        setSelection({
          start: content.indexOf(range.toString()),
          end: content.indexOf(range.toString()) + range.toString().length,
        });
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  const handleAnnotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection) return;

    createAnnotationMutation.mutate({
      content: newAnnotation,
      startOffset: selection.start,
      endOffset: selection.end,
      parentId: replyTo,
    });
  };

  const renderAnnotations = () => {
    const sortedAnnotations = annotations?.sort((a: any, b: any) => 
      a.startOffset - b.startOffset || a.createdAt.localeCompare(b.createdAt)
    );

    return sortedAnnotations?.map((annotation: any) => (
      <div key={annotation.id} className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          <span className="font-medium">{annotation.username}</span>
          <Badge variant="outline" className="text-xs">
            {new Date(annotation.createdAt).toLocaleString()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground pl-7">{annotation.content}</p>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyTo(annotation.id)}
            className="text-xs"
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Intelligence Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={contentRef} 
            className="prose dark:prose-invert max-w-none"
          >
            {content}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Annotations
            <div className="flex gap-2">
              {Array.from(typingUsers).map((username) => (
                <Badge key={username} variant="outline" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  {username}
                  <PencilLine className="h-3 w-3 ml-1 animate-pulse" />
                </Badge>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selection && (
            <form onSubmit={handleAnnotationSubmit} className="mb-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Selected text: "{content.slice(selection.start, selection.end)}"
              </div>
              <Textarea
                placeholder="Add your annotation..."
                value={newAnnotation}
                onChange={(e) => {
                  setNewAnnotation(e.target.value);
                  startTyping("annotation", intelligenceId);
                }}
                onBlur={() => stopTyping("annotation", intelligenceId)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelection(null);
                    setNewAnnotation("");
                    setReplyTo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newAnnotation.trim()}>
                  Add Annotation
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {renderAnnotations()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

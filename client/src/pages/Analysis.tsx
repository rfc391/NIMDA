import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Loader2, UserCircle, PencilLine } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { debounce } from "lodash";

export default function Analysis() {
  const [newIntel, setNewIntel] = useState({
    title: "",
    content: "",
    classification: "unclassified",
  });
  const [typingUsers, setTypingUsers] = useState(new Set<string>());
  const [activeUsers, setActiveUsers] = useState(new Set<string>());
  const [filter, setFilter] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { sendMessage, subscribe, startTyping, stopTyping } = useWebSocket();

  const { data: intelligence, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intelligence"],
  });

  // Debounced typing notification
  const debouncedStartTyping = useCallback(
    debounce(() => startTyping('intelligence'), 500),
    [startTyping]
  );

  const debouncedStopTyping = useCallback(
    debounce(() => stopTyping('intelligence'), 500),
    [stopTyping]
  );

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === "intelligence_created") {
        queryClient.invalidateQueries({ queryKey: ["/api/intelligence"] });
        toast({
          title: "New Intelligence Report",
          description: `${message.data.username} created a new report: ${message.data.title}`,
        });
      } else if (message.type === "user_active") {
        setActiveUsers((prev) => new Set([...Array.from(prev), message.data.username]));
      } else if (message.type === "user_inactive") {
        setActiveUsers((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(message.data.username);
          return newSet;
        });
      } else if (message.type === "typing_start" && message.data.type === "intelligence") {
        setTypingUsers((prev) => new Set([...Array.from(prev), message.data.username]));
      } else if (message.type === "typing_end" && message.data.type === "intelligence") {
        setTypingUsers((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(message.data.username);
          return newSet;
        });
      }
    });

    sendMessage({
      type: "user_active",
      data: { username: user?.username },
    });

    return () => {
      unsubscribe?.();
      sendMessage({
        type: "user_inactive",
        data: { username: user?.username },
      });
    };
  }, [subscribe, sendMessage, queryClient, toast, user, startTyping, stopTyping]);

  // Handle input changes with typing indicators
  const handleInputChange = (field: keyof typeof newIntel) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewIntel({ ...newIntel, [field]: e.target.value });
    debouncedStartTyping();
  };

  const handleInputBlur = () => {
    debouncedStopTyping();
  }

  const filteredIntelligence = intelligence?.filter((intel) =>
    intel.title.toLowerCase().includes(filter.toLowerCase()) ||
    intel.content.toLowerCase().includes(filter.toLowerCase()) ||
    intel.classification.toLowerCase().includes(filter.toLowerCase())
  );

  const createIntelMutation = useMutation({
    mutationFn: async (intel: typeof newIntel) => {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(intel),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence"] });
      toast({ title: "Success", description: "Intelligence report created" });
      setNewIntel({ title: "", content: "", classification: "unclassified" });

      // Notify other users
      sendMessage({
        type: "intelligence_created",
        data: {
          username: user?.username,
          title: data.title,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              New Intelligence Report
              <div className="flex gap-2">
                {Array.from(activeUsers).map((username) => (
                  <Badge key={username} variant="outline" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    {username}
                    {typingUsers.has(username) && (
                      <PencilLine className="h-3 w-3 ml-1 animate-pulse" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createIntelMutation.mutate(newIntel);
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Title"
                value={newIntel.title}
                onChange={handleInputChange("title")}
                onBlur={handleInputBlur}
              />
              <Textarea
                placeholder="Content"
                value={newIntel.content}
                onChange={handleInputChange("content")}
                onBlur={handleInputBlur}
              />
              <Select
                value={newIntel.classification}
                onValueChange={(value) =>
                  setNewIntel({ ...newIntel, classification: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unclassified">Unclassified</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                  <SelectItem value="top_secret">Top Secret</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={createIntelMutation.isPending}>
                {createIntelMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Report
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {intelligence?.slice(0, 1).map((intel) => (
              <div key={intel.id} className="space-y-4">
                {intel.aiProcessed && (
                  <>
                    <div>
                      <h3 className="font-medium mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground">{intel.aiProcessed.summary}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Key Entities</h3>
                      <div className="flex flex-wrap gap-2">
                        {intel.aiProcessed.entities.map((entity: string) => (
                          <Badge key={entity} variant="secondary">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Sentiment</span>
                          <Badge variant={
                            intel.aiProcessed.sentiment === "positive" ? "default" :
                            intel.aiProcessed.sentiment === "negative" ? "destructive" : "secondary"
                          }>
                            {intel.aiProcessed.sentiment}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <Badge variant="outline">
                            {Math.round(intel.aiProcessed.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {intel.aiProcessed.recommendations.map((rec: string) => (
                          <li key={rec}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intelligence Reports</CardTitle>
          <Input
            placeholder="Search reports..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIntelligence?.map((intel) => (
              <div
                key={intel.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="font-medium">{intel.title}</div>
                <div className="text-sm text-muted-foreground">
                  {intel.content}
                </div>
                <div className="text-sm flex justify-between items-center">
                  <span>Classification: {intel.classification}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(intel.createdAt).toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
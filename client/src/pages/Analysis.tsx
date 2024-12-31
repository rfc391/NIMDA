import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Loader2, UserCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";

export default function Analysis() {
  const [newIntel, setNewIntel] = useState({
    title: "",
    content: "",
    classification: "unclassified",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { sendMessage, subscribe } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState(new Set<string>());

  const { data: intelligence, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intelligence"],
  });

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribe((message) => {
      if (message.type === "intelligence_created") {
        // Refresh intelligence data
        queryClient.invalidateQueries({ queryKey: ["/api/intelligence"] });
        // Show notification
        toast({
          title: "New Intelligence Report",
          description: `${message.data.username} created a new report: ${message.data.title}`,
        });
      } else if (message.type === "user_active") {
        setActiveUsers((prev) => new Set([...prev, message.data.username]));
      } else if (message.type === "user_inactive") {
        setActiveUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(message.data.username);
          return newSet;
        });
      }
    });

    // Announce presence
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
  }, [subscribe, sendMessage, queryClient, toast, user]);

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
                onChange={(e) =>
                  setNewIntel({ ...newIntel, title: e.target.value })
                }
              />
              <Textarea
                placeholder="Content"
                value={newIntel.content}
                onChange={(e) =>
                  setNewIntel({ ...newIntel, content: e.target.value })
                }
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intelligence Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {intelligence?.map((intel) => (
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
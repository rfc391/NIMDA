import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, UserCircle, PencilLine } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { debounce } from "lodash";

export default function Alerts() {
  const [newAlert, setNewAlert] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [typingUsers, setTypingUsers] = useState(new Set<string>());
  const [activeUsers, setActiveUsers] = useState(new Set<string>());
  const [filter, setFilter] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { sendMessage, subscribe, startTyping, stopTyping } = useWebSocket();

  const { data: alerts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/alerts"],
  });

  // Debounced typing notification
  const debouncedStartTyping = useCallback(
    debounce(() => startTyping('alert'), 500),
    [startTyping]
  );

  const debouncedStopTyping = useCallback(
    debounce(() => stopTyping('alert'), 500),
    [stopTyping]
  );

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === "alert_created") {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        toast({
          title: "New Alert Created",
          description: `${message.data.username} created a new alert: ${message.data.title}`,
          variant: message.data.priority === "critical" ? "destructive" : "default",
        });
      } else if (message.type === "user_active") {
        setActiveUsers((prev) => new Set([...prev, message.data.username]));
      } else if (message.type === "user_inactive") {
        setActiveUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(message.data.username);
          return newSet;
        });
      } else if (message.type === "typing_start" && message.data.type === "alert") {
        setTypingUsers((prev) => new Set([...prev, message.data.username]));
      } else if (message.type === "typing_end" && message.data.type === "alert") {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
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
  }, [subscribe, sendMessage, queryClient, toast, user, debouncedStartTyping, debouncedStopTyping]);

  // Handle input changes with typing indicators
  const handleInputChange = (field: keyof typeof newAlert) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewAlert({ ...newAlert, [field]: e.target.value });
    debouncedStartTyping();
  };

  const handleInputBlur = () => {
    debouncedStopTyping();
  }

  const filteredAlerts = alerts?.filter((alert) =>
    alert.title.toLowerCase().includes(filter.toLowerCase()) ||
    alert.description.toLowerCase().includes(filter.toLowerCase()) ||
    alert.priority.toLowerCase().includes(filter.toLowerCase())
  );

  const createAlertMutation = useMutation({
    mutationFn: async (alert: typeof newAlert) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(alert),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ 
        title: "Success", 
        description: "Alert created",
        variant: data.priority === "critical" ? "destructive" : "default"
      });
      setNewAlert({ title: "", description: "", priority: "medium" });

      // Notify other users
      sendMessage({
        type: "alert_created",
        data: {
          username: user?.username,
          title: data.title,
          priority: data.priority
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
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Create Alert
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
              createAlertMutation.mutate(newAlert);
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Title"
              value={newAlert.title}
              onChange={handleInputChange("title")}
              onBlur={handleInputBlur}
            />
            <Textarea
              placeholder="Description"
              value={newAlert.description}
              onChange={handleInputChange("description")}
              onBlur={handleInputBlur}
            />
            <Select
              value={newAlert.priority}
              onValueChange={(value) =>
                setNewAlert({ ...newAlert, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={createAlertMutation.isPending}>
              {createAlertMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Alert
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <Input
            placeholder="Search alerts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts?.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg space-y-2 ${
                  alert.priority === "critical"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {alert.priority === "critical" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="font-medium">{alert.title}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {alert.description}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Priority: {alert.priority}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(alert.createdAt).toLocaleString()}
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
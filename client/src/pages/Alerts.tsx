import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, UserCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";

export default function Alerts() {
  const [newAlert, setNewAlert] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { sendMessage, subscribe } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState(new Set<string>());

  const { data: alerts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/alerts"],
  });

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribe((message) => {
      if (message.type === "alert_created") {
        // Refresh alerts data
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        // Show notification
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
              onChange={(e) =>
                setNewAlert({ ...newAlert, title: e.target.value })
              }
            />
            <Textarea
              placeholder="Description"
              value={newAlert.description}
              onChange={(e) =>
                setNewAlert({ ...newAlert, description: e.target.value })
              }
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts?.map((alert) => (
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
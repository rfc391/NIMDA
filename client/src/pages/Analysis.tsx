import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Analysis() {
  const [newIntel, setNewIntel] = useState({
    title: "",
    content: "",
    classification: "unclassified",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: intelligence, isLoading } = useQuery<any[]>({
    queryKey: ["/api/intelligence"],
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence"] });
      toast({ title: "Success", description: "Intelligence report created" });
      setNewIntel({ title: "", content: "", classification: "unclassified" });
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
          <CardTitle>New Intelligence Report</CardTitle>
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
                <div className="text-sm">
                  Classification: {intel.classification}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

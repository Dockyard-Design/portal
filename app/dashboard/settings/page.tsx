import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpEnabled, setIsSignUpEnabled] = useState(true);

  const toggleSignUp = async () => {
    setIsLoading(true);
    try {
      // This will be a server action or API call to update the setting in Supabase
      await fetch('/api/settings/signup-status', {
        method: 'POST',
        method: 'POST',
        body: JSON.stringify({ enabled: !isSignUpEnabled }),
      });
      setIsSignUpEnabled(!isSignUpEnabled);
      toast.success("Sign-up status updated");
    } catch (error) {
      toast.error("Failed to update sign-up status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <div className="max-w-2xl p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
        <p className="text-muted-foreground mb-4">Application Configuration</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex flex-col gap-1">
              <div className="font-medium">Allow Public Sign-up</div>
              <div className="text-sm text-muted-foreground">
                Allow new users to create accounts on the platform.
              </div>
            </div>
            <Switch 
              checked={isSignUpEnabled} 
              onCheckedChange={toggleSignUp} 
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

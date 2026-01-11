import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Application History</h1>
        <p className="text-muted-foreground">Review your past resume analyses and interview preparations.</p>
      </header>
      <Card className="flex flex-col items-center justify-center text-center p-12">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4">
            <History className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
          <CardDescription>We're working on building out the history feature. <br /> Check back later to see all your activity.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

import { MockInterviewChatbot } from "@/components/dashboard/mock-interview-chatbot";

export default function InterviewPrepPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">AI Mock Interview</h1>
        <p className="text-muted-foreground">Practice your interview skills with an AI that provides real-time feedback.</p>
      </header>
      <MockInterviewChatbot />
    </div>
  );
}

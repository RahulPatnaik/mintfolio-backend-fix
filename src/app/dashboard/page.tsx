import { ResumeMatcher } from '@/components/dashboard/resume-matcher';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResumeMatcherPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Resume Matcher</h1>
        <p className="text-muted-foreground">Upload your resume and a job description to see how well they match.</p>
      </header>
      <ResumeMatcher />
    </div>
  );
}

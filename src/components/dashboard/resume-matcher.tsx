'use client';

import { useState } from 'react';
import { resumeMatcher, type ResumeMatcherOutput } from '@/ai/flows/resume-matcher';
import { skillGapAnalyzer, type SkillGapAnalyzerOutput } from '@/ai/flows/skill-gap-analyzer';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/ui/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Lightbulb, BookOpen, Code } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export function ResumeMatcher() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeMatcherOutput | null>(null);
  const [skillGapResult, setSkillGapResult] = useState<SkillGapAnalyzerOutput | null>(null);
  const { toast } = useToast();

  const handleMatch = async () => {
    if (!resumeFile || !jdFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Files',
        description: 'Please upload both a resume and a job description.',
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setSkillGapResult(null);
    try {
      const resumeDataUri = await fileToDataUri(resumeFile);
      const jobDescriptionDataUri = await fileToDataUri(jdFile);

      const response = await resumeMatcher({ resumeDataUri, jobDescriptionDataUri });
      setResult(response);

      if (response.resumeText && response.jobDescriptionText) {
        const skillGapResponse = await skillGapAnalyzer({
          resumeText: response.resumeText,
          jobDescriptionText: response.jobDescriptionText,
        });
        setSkillGapResult(skillGapResponse);
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Matching Failed',
        description: 'An error occurred while analyzing the documents. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Resume</CardTitle>
            <CardDescription>Upload your resume in PDF format.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              file={resumeFile}
              onFileChange={setResumeFile}
              accept=".pdf"
              title="resume"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>Upload the job description in PDF format.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              file={jdFile}
              onFileChange={setJdFile}
              accept=".pdf"
              title="job description"
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
        <Button onClick={handleMatch} disabled={!resumeFile || !jdFile || loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
             <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
             <p className="mt-4 text-muted-foreground">Analyzing documents with AI. This may take a moment...</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Match Score</CardTitle>
              <CardDescription>Your resume's compatibility with the job.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="relative h-32 w-32">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                          className="text-border"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                      />
                      <path
                          className="text-primary"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${result.matchScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{result.matchScore}</span>
                      <span className="text-lg text-muted-foreground">%</span>
                  </div>
              </div>
              <Progress value={result.matchScore} className="h-2" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Key Highlights</CardTitle>
              <CardDescription>Areas where your resume shows strong alignment with the job description.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                    <div className="prose prose-sm max-w-none prose-strong:text-green-900 prose-em:text-green-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{highlight}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {skillGapResult && (
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Analysis</CardTitle>
            <CardDescription>Skills required for the job that are missing from your resume, and resources to learn them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(skillGapResult.missingHardSkills.length > 0 || skillGapResult.missingSoftSkills.length > 0) ? (
              <div className="space-y-6">
                {skillGapResult.missingHardSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hard Skills to Develop</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {skillGapResult.missingHardSkills.map((skill, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary" /> {skill.skill}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {skill.recommendedCourse && (
                              <div className="flex items-start gap-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                  <p className="font-semibold">Course: {skill.recommendedCourse.title}</p>
                                  <p className="text-sm text-muted-foreground">Provider: {skill.recommendedCourse.provider}</p>
                                  <Button variant="link" asChild className="p-0 h-auto">
                                    <Link href={skill.recommendedCourse.url} target="_blank">Learn More</Link>
                                  </Button>
                                </div>
                              </div>
                            )}
                            {skill.recommendedDSAProblem && (
                              <div className="flex items-start gap-3">
                                <Code className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                  <p className="font-semibold">DSA Practice: {skill.recommendedDSAProblem.title}</p>
                                  <Button variant="link" asChild className="p-0 h-auto">
                                    <Link href={skill.recommendedDSAProblem.url} target="_blank">Practice Now</Link>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                 {skillGapResult.missingSoftSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Soft Skills to Highlight</h3>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {skillGapResult.missingSoftSkills.map((skill, index) => (
                           <Card key={index}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary" /> {skill.skill}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {skill.recommendedCourse && (
                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                    <p className="font-semibold">Course: {skill.recommendedCourse.title}</p>
                                    <p className="text-sm text-muted-foreground">Provider: {skill.recommendedCourse.provider}</p>
                                    <Button variant="link" asChild className="p-0 h-auto">
                                        <Link href={skill.recommendedCourse.url} target="_blank">Learn More</Link>
                                    </Button>
                                    </div>
                                </div>
                                )}
                            </CardContent>
                           </Card>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No significant skill gaps identified. Great job!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

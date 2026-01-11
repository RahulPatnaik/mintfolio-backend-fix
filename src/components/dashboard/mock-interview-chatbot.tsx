'use client';

import { useState } from 'react';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import { generateSuggestedAnswers } from '@/ai/flows/generate-suggested-answers';
import { answerCritique } from '@/ai/flows/answer-critique';
import { resumeMatcher } from '@/ai/flows/resume-matcher';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/ui/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, HelpCircle, Lightbulb, RefreshCw, BrainCircuit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export function MockInterviewChatbot() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isCritiquing, setIsCritiquing] = useState(false);

  const [texts, setTexts] = useState<{ resumeText: string, jobDescriptionText: string } | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [suggestedAnswer, setSuggestedAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [critique, setCritique] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleGenerateQuestion = async () => {
    if (!resumeFile || !jdFile) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please upload both your resume and the job description.' });
      return;
    }
    setIsLoading(true);
    setQuestion(null);
    setSuggestedAnswer(null);
    setTexts(null);
    setUserAnswer('');
    setCritique(null);
    
    try {
      const resumeDataUri = await fileToDataUri(resumeFile);
      const jobDescriptionDataUri = await fileToDataUri(jdFile);

      const textResponse = await resumeMatcher({ resumeDataUri, jobDescriptionDataUri });
      setTexts({ resumeText: textResponse.resumeText, jobDescriptionText: textResponse.jobDescriptionText });

      const questionResponse = await generateInterviewQuestions({
        resumeText: textResponse.resumeText,
        jobDescriptionText: textResponse.jobDescriptionText,
      });
      
      setQuestion(questionResponse.interviewQuestion);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate a question. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAnswer = async () => {
    if (!question || !texts) {
        toast({ variant: 'destructive', title: 'Error', description: 'A question must be generated first.' });
        return;
    }
    setIsAnswering(true);
    try {
        const answerResponse = await generateSuggestedAnswers({
            jobDescription: texts.jobDescriptionText,
            interviewQuestion: question,
        });
        setSuggestedAnswer(answerResponse.suggestedAnswer);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate a suggested answer.' });
    } finally {
        setIsAnswering(false);
    }
  };

  const handleCritiqueAnswer = async () => {
    if (!question || !userAnswer || !texts) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide an answer to get a critique.' });
      return;
    }
    setIsCritiquing(true);
    setCritique(null);
    try {
      const critiqueResponse = await answerCritique({
        jobDescriptionText: texts.jobDescriptionText,
        interviewQuestion: question,
        userAnswer: userAnswer,
      });
      setCritique(critiqueResponse.critique);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate critique. Please try again.' });
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    setJdFile(null);
    setQuestion(null);
    setSuggestedAnswer(null);
    setTexts(null);
    setUserAnswer('');
    setCritique(null);
  }

  const allInteractionsDisabled = isLoading || isAnswering || isCritiquing;

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prepare for Your Interview</CardTitle>
            <CardDescription>Upload your documents, and we'll generate a relevant interview question for you to practice.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <FileUploader
                file={resumeFile}
                onFileChange={setResumeFile}
                accept=".pdf"
                title="resume"
                disabled={allInteractionsDisabled}
              />
              <FileUploader
                file={jdFile}
                onFileChange={setJdFile}
                accept=".pdf"
                title="job description"
                disabled={allInteractionsDisabled}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button onClick={handleGenerateQuestion} disabled={!resumeFile || !jdFile || allInteractionsDisabled} size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Generate Question'}
                </Button>
                {question && (
                    <Button onClick={handleReset} variant="outline" size="lg" disabled={allInteractionsDisabled}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Start Over
                    </Button>
                )}
            </div>
             {isLoading && <p className="text-sm text-muted-foreground">AI is thinking... this may take a moment.</p>}
          </CardFooter>
        </Card>

      {question && (
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><HelpCircle className="text-primary"/> Your Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">{question}</p>
             <div className="space-y-2">
              <label htmlFor="user-answer" className="font-medium">Your Answer</label>
              <Textarea
                id="user-answer"
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                disabled={allInteractionsDisabled}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
              <Button onClick={handleCritiqueAnswer} disabled={!userAnswer || allInteractionsDisabled}>
                  {isCritiquing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  {isCritiquing ? 'Analyzing...' : 'Critique My Answer'}
              </Button>
              {!suggestedAnswer && (
                <Button onClick={handleShowAnswer} disabled={allInteractionsDisabled} variant="secondary">
                    {isAnswering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    {isAnswering ? 'Generating...' : 'Show Suggested Answer'}
                </Button>
              )}
          </CardFooter>
        </Card>
      )}

      {critique && (
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <BrainCircuit className="h-5 w-5" />
                Feedback on Your Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-strong:text-blue-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{critique}</ReactMarkdown>
            </CardContent>
        </Card>
      )}

      {suggestedAnswer && (
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Lightbulb className="h-5 w-5" />
                Suggested Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none prose-headings:text-amber-900">
                <p className="text-gray-700 leading-relaxed">{suggestedAnswer}</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}

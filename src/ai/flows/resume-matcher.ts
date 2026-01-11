'use server';

/**
 * @fileOverview This file contains the flow for matching a resume against a job description.
 *
 * - resumeMatcher - A function that takes a resume and job description as input and returns a match score and highlighted areas.
 * - ResumeMatcherInput - The input type for the resumeMatcher function.
 * - ResumeMatcherOutput - The return type for the resumeMatcher function.
 */
import {z} from 'genkit';
import { Mistral } from '@mistralai/mistralai';
import { extractTextFromPdf } from '@/lib/pdf-parser';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: apiKey,
  timeoutMs: 120000, // 120 seconds timeout
});

const ResumeMatcherInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume in PDF format, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescriptionDataUri: z
    .string()
    .describe(
      "A job description in PDF format, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ResumeMatcherInput = z.infer<typeof ResumeMatcherInputSchema>;

const ResumeMatcherOutputSchema = z.object({
  matchScore: z.number().describe('A score indicating the match between the resume and the job description.'),
  highlights: z.array(z.string()).describe('Specific areas of the resume that align with the job description.'),
  resumeText: z.string().describe('The extracted text from the resume PDF.'),
  jobDescriptionText: z.string().describe('The extracted text from the job description PDF.'),
});
export type ResumeMatcherOutput = z.infer<typeof ResumeMatcherOutputSchema>;


export async function resumeMatcher(input: ResumeMatcherInput): Promise<ResumeMatcherOutput> {
  const resumeText = await extractTextFromPdf(input.resumeDataUri);
  const jobDescriptionText = await extractTextFromPdf(input.jobDescriptionDataUri);

  const prompt = `You are an AI resume matcher. You will be provided with a resume and a job description.

  Analyze the resume and job description and provide a match score (0-100) indicating how well the resume matches the job description.
  Also, identify 4-6 specific areas of the resume that align with the job description and provide them as highlights.

  Format each highlight using markdown for readability:
  - Use **bold** for key skills, technologies, or important terms
  - Use *italics* for project names or specific accomplishments
  - Keep each highlight as a single, clear sentence or brief paragraph
  - Focus on concrete skills, experiences, and achievements that match the job requirements

  Resume Text:
  ${resumeText}

  Job Description Text:
  ${jobDescriptionText}

  Provide the analysis in a JSON format like this:
  {
    "matchScore": 85,
    "highlights": [
      "Strong foundation in **C++ and Python**, which aligns with the preferred training mentioned in the job description.",
      "Experience with **software development methodologies** through projects like *TriageFlow*, demonstrating structured development processes.",
      "Leadership skills evidenced by role as **Junior Core at RVCE Coding Club**, showcasing teamwork and communication abilities."
    ]
  }
  `;

  const chatResponse = await client.chat.complete({
    model: 'mistral-large-latest',
    responseFormat: { type: 'json_object' },
    messages: [{role: 'user', content: prompt}],
  });
  
  const rawOutput = chatResponse.choices?.[0]?.message?.content;
  if (!rawOutput) {
    throw new Error('No response from Mistral AI');
  }
  const parsedOutput = JSON.parse(rawOutput);

  return ResumeMatcherOutputSchema.parse({
    ...parsedOutput,
    resumeText,
    jobDescriptionText,
  });
}

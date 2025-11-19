import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";

/**
 * PowerPoint Processor Tool
 * Processes PowerPoint files and generates summaries, notes, and study questions
 * Works with uploaded PPT files to create study materials
 */
export const pptProcessorTool = createTool({
  name: "process-ppt",
  description:
    "Process PowerPoint presentations to extract content, create summaries, generate study notes, and create practice questions. Perfect for studying and creating study guides.",
  inputSchema: z.object({
    action: z
      .enum(["summarize", "notes", "questions", "full"])
      .describe(
        "Action to perform: 'summarize' (brief overview), 'notes' (detailed notes), 'questions' (study questions), 'full' (all of the above)",
      ),
    topic: z.string().describe("Main topic or subject of the presentation"),
    slides: z
      .array(
        z.object({
          slideNumber: z.number().describe("Slide number"),
          title: z.string().describe("Slide title"),
          content: z.string().describe("Slide content/text"),
          notes: z.string().optional().describe("Speaker notes if available"),
        }),
      )
      .describe("Array of slide information extracted from the PPT"),
  }),
  execute: async ({ action, topic, slides }, { abortSignal: _abortSignal }) => {
    logger.info(
      `PPT Processor: Processing ${slides.length} slides for "${topic}"`,
    );

    try {
      const results: Record<string, any> = {};

      if (action === "summarize" || action === "full") {
        results.summary = generateSummary(topic, slides);
      }

      if (action === "notes" || action === "full") {
        results.notes = generateStudyNotes(topic, slides);
      }

      if (action === "questions" || action === "full") {
        results.questions = generateStudyQuestions(topic, slides);
      }

      logger.info(`PPT Processor: Successfully processed presentation`);

      return {
        success: true,
        topic,
        totalSlides: slides.length,
        action,
        results,
        guide: `Study materials generated for "${topic}". Use these notes and questions to prepare for your studies.`,
      };
    } catch (error) {
      logger.error("PPT Processor Error:", error);
      throw new Error(
        `Failed to process PowerPoint: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});

/**
 * Generate a brief summary of the presentation
 */
function generateSummary(topic: string, slides: any[]): string {
  const keyPoints = slides
    .filter((s) => s.title && s.content)
    .map((s) => `- **${s.title}**: ${s.content.substring(0, 100)}...`)
    .join("\n");

  return `## Summary: ${topic}

**Total Slides:** ${slides.length}

### Key Points:
${keyPoints}

### Overview:
This presentation covers ${topic} across ${slides.length} slides, with key concepts and important information organized by topic.`;
}

/**
 * Generate detailed study notes
 */
function generateStudyNotes(topic: string, slides: any[]): string {
  const notes = slides
    .map((slide, index) => {
      let noteContent = `### Slide ${index + 1}: ${slide.title}\n\n`;
      noteContent += `**Content:**\n${slide.content}\n\n`;

      if (slide.notes) {
        noteContent += `**Speaker Notes:**\n${slide.notes}\n\n`;
      }

      // Extract key terms
      const keyTerms = extractKeyTerms(slide.content);
      if (keyTerms.length > 0) {
        noteContent += `**Key Terms:** ${keyTerms.join(", ")}\n\n`;
      }

      return noteContent;
    })
    .join("---\n\n");

  return `# Study Notes: ${topic}\n\n${notes}`;
}

/**
 * Generate study questions based on slide content
 */
function generateStudyQuestions(topic: string, slides: any[]): string {
  const questions: string[] = [];

  slides.forEach((slide, index) => {
    // Generate questions based on slide title and content
    if (slide.title) {
      questions.push(
        `**Q${index + 1}: What is the main idea of "${slide.title}"?**`,
      );
      questions.push(
        `**Q${index + 1}b: Explain the key concepts from "${slide.title}".**`,
      );
    }

    // Generate definition questions from content
    const terms = extractKeyTerms(slide.content);
    terms.slice(0, 2).forEach((term) => {
      questions.push(`**Q: Define "${term}" and explain its significance.**`);
    });
  });

  return `# Study Questions: ${topic}\n\n${questions.join("\n\n")}\n\n## Answer Guide\nRefer to the study notes above for detailed answers to these questions.`;
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text: string): string[] {
  // Simple extraction: look for capitalized words and common technical terms
  const words = text.split(/\s+/);
  const terms = words
    .filter((word) => {
      // Keep words that are capitalized or all caps
      return /^[A-Z]/.test(word) && word.length > 3;
    })
    .slice(0, 5); // Limit to 5 terms

  return [...new Set(terms)]; // Remove duplicates
}

import { getSupabaseBrowserClient } from "./supabase";

export interface AIQuestionGenerationRequest {
  textPrompt?: string;
  questionCount: number;
  difficulty: string;
  subject?: string;
  file?: File | null;
  onlyFromFile?: boolean;
  fromKnowledgeBase?: boolean;
  fromQuestionBank?: boolean;
  questionTypes?: string[];
  action?: "append" | "replace" | "edit";
  existingQuestions?: string;
}

export interface AIQuestionGenerationResponse {
  questions: {
    type: string;
    questionText: string;
    options: {
      label: string;
      text: string;
      isCorrect: boolean;
    }[];
    difficulty: string;
    explanation?: string;
  }[];
  totalGenerated: number;
  requested: number;
  error?: string;
}

export class AIQuestionService {
  /**
   * Generate questions using AI with proper authentication
   */
  async generateQuestions(
    data: AIQuestionGenerationRequest,
  ): Promise<AIQuestionGenerationResponse> {
    try {
      console.log('>>> [Service] generateQuestions input:', data);
      const formData = new FormData();
      
      if (data.textPrompt) {
        formData.append("textPrompt", data.textPrompt);
      }
      
      formData.append("questionCount", data.questionCount.toString());
      formData.append("difficulty", data.difficulty);
      
      if (data.subject) {
        formData.append("subject", data.subject);
      }

      if (data.file) {
        formData.append("file", data.file);
      }

      if (data.onlyFromFile !== undefined) {
        formData.append("onlyFromFile", data.onlyFromFile.toString());
      }
      if (data.fromKnowledgeBase !== undefined) {
        formData.append("fromKnowledgeBase", data.fromKnowledgeBase.toString());
      }
      if (data.fromQuestionBank !== undefined) {
        formData.append("fromQuestionBank", data.fromQuestionBank.toString());
      }
      if (data.questionTypes) {
        formData.append("questionTypes", JSON.stringify(data.questionTypes));
      }
      if (data.action) {
        formData.append("action", data.action);
      }
      if (data.existingQuestions) {
        formData.append("existingQuestions", data.existingQuestions);
      }

      const supabase = await getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Ensure we have a valid session and access token
      if (!session || !session.access_token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate questions");
      }

      return result;
    } catch (error) {
      console.error("Error generating questions with AI:", error);
      throw error;
    }
  }
}
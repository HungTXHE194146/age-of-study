import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Question, QuestionType, DifficultyLevel } from "@/types/teacher";

export interface QuestionFilter {
  subjectId?: string;
  nodeId?: string;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionBankQuestion extends Question {
  subject_name?: string;
  node_title?: string;
  created_at_formatted?: string;
}

interface SupabaseQuestionData {
  id: number;
  node_id: number;
  content: {
    question: string;
    options: string[];
  };
  correct_option_index: number;
  difficulty: string;
  status: string;
  created_by: string;
  created_at: string;
  q_type: string;
  nodes: {
    id: number;
    title: string;
    subject_id: number;
    subjects: {
      id: number;
      name: string;
    };
  };
}

export class QuestionBankService {
  private supabase = getSupabaseBrowserClient();

  async getQuestions(filter: QuestionFilter): Promise<QuestionBankQuestion[]> {
    try {
      let query = this.supabase
        .from("questions")
        .select(
          `
          id,
          node_id,
          content,
          correct_option_index,
          difficulty,
          status,
          created_by,
          created_at,
          subject_id,
          q_type,
          nodes (
            id,
            title,
            subject_id,
            subjects (
              id,
              name
            )
          )
        `,
        )
        .eq("status", "available");

      // Apply filters based on new logic:
      // - If only "Subject" is selected -> Query: WHERE subject_id = X
      // - If "Subject" AND "Topic" are selected -> Query: WHERE node_id = Y

      if (filter.nodeId && filter.nodeId !== "0") {
        // If a specific node is selected, filter by node_id (this overrides subject filter)
        query = query.eq("node_id", parseInt(filter.nodeId));
      } else if (filter.subjectId && filter.subjectId !== "0") {
        // If only subject is selected (no specific node), filter by direct subject_id
        query = query.eq("subject_id", parseInt(filter.subjectId));
      }

      if (filter.difficulty) {
        query = query.eq("difficulty", filter.difficulty.toLowerCase());
      }

      if (filter.type) {
        // Filter by question type using the q_type column
        const qTypeMap: Record<QuestionType, string> = {
          MULTIPLE_CHOICE: "multiple_choice",
          TRUE_FALSE: "true_false",
          ESSAY: "essay",
        };
        const dbQuestionType = qTypeMap[filter.type];
        if (dbQuestionType) {
          query = query.eq("q_type", dbQuestionType);
        }
      }

      if (filter.search) {
        // Search specifically in the question text within the content JSON field
        query = query.ilike("content->>question", `%${filter.search}%`);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(
          filter.offset,
          (filter.offset || 0) + (filter.limit || 20),
        );
      }

      // Order by creation date (newest first)
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching questions:", error);
        throw error;
      }

      // Transform data to match our interface
      return (data || []).map((q: SupabaseQuestionData) => ({
        id: q.id,
        createdAt: new Date(q.created_at).getTime(),
        number: 0, // Will be set when added to test
        type: this.mapQuestionType(q.q_type),
        questionText: q.content.question || "",
        options: this.parseOptions(q.content.options || []),
        difficulty: this.mapDifficulty(q.difficulty),
        topic: q.nodes?.title || "Chưa xác định",
        subject_name: q.nodes?.subjects?.name,
        node_title: q.nodes?.title,
        created_at_formatted: new Date(q.created_at).toLocaleDateString(
          "vi-VN",
        ),
      }));
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      return [];
    }
  }

  async getQuestionCount(filter: QuestionFilter): Promise<number> {
    try {
      let query = this.supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("status", "available");

      // Apply filters based on new logic:
      // - If only "Subject" is selected -> Query: WHERE subject_id = X
      // - If "Subject" AND "Topic" are selected -> Query: WHERE node_id = Y

      if (filter.nodeId && filter.nodeId !== "0") {
        // If a specific node is selected, filter by node_id (this overrides subject filter)
        query = query.eq("node_id", parseInt(filter.nodeId));
      } else if (filter.subjectId && filter.subjectId !== "0") {
        // If only subject is selected (no specific node), filter by direct subject_id
        query = query.eq("subject_id", parseInt(filter.subjectId));
      }

      if (filter.difficulty) {
        query = query.eq("difficulty", filter.difficulty.toLowerCase());
      }

      if (filter.type) {
        // Filter by question type using the q_type column
        const qTypeMap: Record<QuestionType, string> = {
          MULTIPLE_CHOICE: "multiple_choice",
          TRUE_FALSE: "true_false",
          ESSAY: "essay",
        };
        const dbQuestionType = qTypeMap[filter.type];
        if (dbQuestionType) {
          query = query.eq("q_type", dbQuestionType);
        }
      }

      if (filter.search) {
        const searchPattern = `%${filter.search}%`;
        // Search specifically in the question text within the content JSON field
        query = query.ilike("content->>question", searchPattern);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error counting questions:", error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to count questions:", error);
      return 0;
    }
  }

  async getSubjects(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await this.supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching subjects:", error);
        throw error;
      }

      return (data || []).map((s: { id: number; name: string }) => ({
        id: s.id.toString(),
        name: s.name,
      }));
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      return [];
    }
  }

  async getNodesBySubject(
    subjectId: string,
  ): Promise<{ id: string; title: string }[]> {
    try {
      const { data, error } = await this.supabase
        .from("nodes")
        .select("id, title")
        .eq("subject_id", parseInt(subjectId))
        .order("title", { ascending: true });

      if (error) {
        console.error("Error fetching nodes:", error);
        throw error;
      }

      return (data || []).map((n: { id: number; title: string }) => ({
        id: n.id.toString(),
        title: n.title,
      }));
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
      return [];
    }
  }

  private detectQuestionType(content: {
    question: string;
    options: string[];
  }): QuestionType {
    // Simple heuristic based on content structure
    if (content && content.options && content.options.length === 2) {
      return "TRUE_FALSE";
    } else if (content && content.options && content.options.length > 2) {
      return "MULTIPLE_CHOICE";
    }
    return "ESSAY";
  }

  private parseOptions(
    options: string[],
  ): { id: string; label: string; text: string; isCorrect: boolean }[] {
    return (options || []).map((option, index) => ({
      id: (index + 1).toString(),
      label: String.fromCharCode(65 + index), // A, B, C, D
      text: option,
      isCorrect: false, // We don't store this in the bank, will be set when added to test
    }));
  }

  private mapDifficulty(difficulty: string): DifficultyLevel {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      default:
        return "Easy";
    }
  }

  private mapQuestionType(qType: string): QuestionType {
    switch (qType?.toLowerCase()) {
      case "multiple_choice":
        return "MULTIPLE_CHOICE";
      case "true_false":
        return "TRUE_FALSE";
      case "essay":
        return "ESSAY";
      default:
        return "MULTIPLE_CHOICE";
    }
  }
}

export const questionBankService = new QuestionBankService();

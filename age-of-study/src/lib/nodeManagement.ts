import { createClient } from "@supabase/supabase-js";

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export interface NodeData {
  id: number;
  title: string;
  description?: string;
  xp: number;
  node_type: "skill" | "quest" | "reward" | "grade" | "subject" | "chapter" | "week" | "lesson" | "content";
  parent_id?: number | null;
  position_x: number;
  position_y: number;
  class_id?: number;
  subject_id?: number;
  grade_id?: number;
  is_active?: boolean;
  prerequisites?: number[];
  max_attempts?: number;
  duration_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  image_url?: string;
  color?: string;
}

export interface Node extends NodeData {
  id: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface NodeManagementResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Tạo một node mới trong cây kỹ năng
 */
export async function createNode(
  data: NodeData,
): Promise<NodeManagementResult<Node>> {
  try {
    const supabase = getSupabaseClient();

    // Validate dữ liệu đầu vào
    if (!data.title || !data.node_type) {
      return {
        success: false,
        error: "Thiếu thông tin bắt buộc: title và node_type",
        details: { providedData: data },
      };
    }

    const { data: newNode, error } = await supabase
      .from("nodes")
      .insert([
        {
          ...data,
          is_active: data.is_active ?? true,
          prerequisites: data.prerequisites || [],
          tags: data.tags || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Lỗi tạo node:", error);
      return {
        success: false,
        error: `Không thể tạo node: ${error.message}`,
        details: { error },
      };
    }

    return {
      success: true,
      data: newNode,
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi tạo node:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi tạo node",
      details: { error },
    };
  }
}

/**
 * Cập nhật thông tin của một node
 */
export async function updateNode(
  id: number,
  data: Partial<NodeData>,
): Promise<NodeManagementResult<Node>> {
  try {
    const supabase = getSupabaseClient();

    // Kiểm tra node có tồn tại không
    const { data: existingNode, error: checkError } = await supabase
      .from("nodes")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingNode) {
      return {
        success: false,
        error: `Node với ID ${id} không tồn tại`,
        details: { providedId: id, checkError },
      };
    }

    // Cập nhật node
    const { data: updatedNode, error } = await supabase
      .from("nodes")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Lỗi cập nhật node:", error);
      return {
        success: false,
        error: `Không thể cập nhật node: ${error.message}`,
        details: { error, providedId: id },
      };
    }

    return {
      success: true,
      data: updatedNode,
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi cập nhật node:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi cập nhật node",
      details: { error },
    };
  }
}

/**
 * Xóa một node
 */
export async function deleteNode(id: number): Promise<NodeManagementResult> {
  try {
    const supabase = getSupabaseClient();

    // Kiểm tra xem node có tồn tại không
    const { data: existingNode, error: checkError } = await supabase
      .from("nodes")
      .select("id, title")
      .eq("id", id)
      .single();

    if (checkError || !existingNode) {
      return {
        success: false,
        error: `Node với ID ${id} không tồn tại`,
        details: { providedId: id, checkError },
      };
    }

    // Kiểm tra xem node có children không
    const { data: children, error: childrenError } = await supabase
      .from("nodes")
      .select("id, title")
      .eq("parent_id", id);

    if (childrenError) {
      console.error("Lỗi kiểm tra children:", childrenError);
      return {
        success: false,
        error: `Không thể kiểm tra children của node: ${childrenError.message}`,
        details: { error: childrenError },
      };
    }

    if (children && children.length > 0) {
      const childrenTitles = children.map((child: { title: string }) => child.title).join(", ");
      return {
        success: false,
        error: `Không thể xóa node vì nó có ${children.length} node con: ${childrenTitles}`,
        details: {
          providedId: id,
          childrenCount: children.length,
          children: children.map((c: { id: number; title: string }) => ({ id: c.id, title: c.title })),
        },
      };
    }

    // Xóa node
    const { error } = await supabase.from("nodes").delete().eq("id", id);

    if (error) {
      console.error("Lỗi xóa node:", error);
      return {
        success: false,
        error: `Không thể xóa node: ${error.message}`,
        details: { error, providedId: id },
      };
    }

    return {
      success: true,
      data: { deletedId: id, deletedTitle: existingNode.title },
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi xóa node:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi xóa node",
      details: { error },
    };
  }
}

/**
 * Cập nhật vị trí của node (dành cho kéo thả)
 */
export async function updateNodePosition(
  id: number,
  x: number,
  y: number,
): Promise<NodeManagementResult<Node>> {
  try {
    const supabase = getSupabaseClient();

    // Kiểm tra node có tồn tại không
    const { data: existingNode, error: checkError } = await supabase
      .from("nodes")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingNode) {
      return {
        success: false,
        error: `Node với ID ${id} không tồn tại`,
        details: { providedId: id, checkError },
      };
    }

    // Cập nhật vị trí
    const { data: updatedNode, error } = await supabase
      .from("nodes")
      .update({
        position_x: x,
        position_y: y,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Lỗi cập nhật vị trí node:", error);
      return {
        success: false,
        error: `Không thể cập nhật vị trí node: ${error.message}`,
        details: { error, providedId: id, providedPosition: { x, y } },
      };
    }

    return {
      success: true,
      data: updatedNode,
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi cập nhật vị trí node:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi cập nhật vị trí node",
      details: { error },
    };
  }
}

/**
 * Lấy danh sách nodes theo class_id hoặc subject_id
 */
export async function getNodesByClassOrSubject(
  classId?: number,
  subjectId?: number,
): Promise<NodeManagementResult<Node[]>> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase.from("nodes").select("*");

    if (classId) {
      query = query.eq("class_id", classId);
    } else if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Lỗi lấy danh sách nodes:", error);
      return {
        success: false,
        error: `Không thể lấy danh sách nodes: ${error.message}`,
        details: {
          error,
          providedClassId: classId,
          providedSubjectId: subjectId,
        },
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi lấy danh sách nodes:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi lấy danh sách nodes",
      details: { error },
    };
  }
}

/**
 * Lấy thông tin chi tiết của một node
 */
export async function getNodeById(
  id: number,
): Promise<NodeManagementResult<Node>> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Lỗi lấy thông tin node:", error);
      return {
        success: false,
        error: `Không thể lấy thông tin node: ${error.message}`,
        details: { error, providedId: id },
      };
    }

    if (!data) {
      return {
        success: false,
        error: `Node với ID ${id} không tồn tại`,
        details: { providedId: id },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Lỗi hệ thống khi lấy thông tin node:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi hệ thống khi lấy thông tin node",
      details: { error },
    };
  }
}

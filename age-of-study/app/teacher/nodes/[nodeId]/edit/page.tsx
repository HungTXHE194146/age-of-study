"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { X, Save, Edit } from "lucide-react";
import { RouteProtectedWrapper } from "@/lib/routeMiddleware";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import { Node } from "@/lib/gradeSkillTreeService";
import {
  updateNode,
  getNodeById,
  NodeManagementResult,
} from "@/lib/nodeManagement";

interface NodeFormData {
  title: string;
  description: string;
  xp: number;
  node_type: string;
  parent_id: number | null;
  position_x: number;
  position_y: number;
  subject_id: number | null;
  grade_id: string | null;
  is_active: boolean;
  prerequisites: number[];
  max_attempts: number;
  duration_minutes: number;
  difficulty: string;
  tags: string[];
  image_url: string;
  color: string;
}

export default function EditNodePage() {
  const router = useRouter();
  const params = useParams();
  const nodeId = params.nodeId as string;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nodeData, setNodeData] = useState<Node | null>(null);

  const [formData, setFormData] = useState<NodeFormData>({
    title: "",
    description: "",
    xp: 0,
    node_type: "lesson",
    parent_id: null,
    position_x: 500,
    position_y: 100,
    subject_id: null,
    grade_id: null,
    is_active: true,
    prerequisites: [],
    max_attempts: 1,
    duration_minutes: 30,
    difficulty: "easy",
    tags: [],
    image_url: "",
    color: "#6b7280",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allSubjects = await subjectService.getSubjects();
        setSubjects(allSubjects);

        // For now, we'll use a simplified approach for all nodes
        // In a real implementation, you'd fetch nodes from your API
        const mockNodes: Node[] = allSubjects.map((subject, index) => ({
          id: index + 1,
          title: subject.name,
          node_type: "subject",
          parent_id: null,
          position_x: 100 + index * 150,
          position_y: 100,
          order_index: index,
          required_xp: 0,
        }));
        setAllNodes(mockNodes);

        // Fetch the specific node data
        const nodeResult = await getNodeById(parseInt(nodeId));
        if (nodeResult.success && nodeResult.data) {
          const node = nodeResult.data;
          const completeNode: Node = {
            ...node,
            required_xp: node.xp || 0,
            order_index: node.id || 0,
          };
          setNodeData(completeNode);
          setFormData({
            title: node.title,
            description: node.description || "",
            xp: node.xp,
            node_type: node.node_type,
            parent_id: node.parent_id || null,
            position_x: node.position_x,
            position_y: node.position_y,
            subject_id: node.subject_id || null,
            grade_id: node.grade_id ? node.grade_id.toString() : null,
            is_active: node.is_active || true,
            prerequisites: node.prerequisites || [],
            max_attempts: node.max_attempts || 1,
            duration_minutes: node.duration_minutes || 30,
            difficulty: node.difficulty || "easy",
            tags: node.tags || [],
            image_url: node.image_url || "",
            color: node.color || "#6b7280",
          });
        } else {
          alert("Không tìm thấy node hoặc có lỗi xảy ra");
          router.push("/teacher/skill-tree");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        alert("Đã xảy ra lỗi khi tải dữ liệu");
        router.push("/teacher/skill-tree");
      } finally {
        setLoading(false);
      }
    };

    if (nodeId) {
      fetchData();
    } else {
      router.push("/teacher/skill-tree");
    }
  }, [nodeId, router]);

  const handleChange = (field: keyof NodeFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        xp: formData.xp,
        node_type: formData.node_type as "lesson" | "skill" | "quest" | "reward" | "grade" | "subject" | "chapter" | "week" | "content",
        parent_id: formData.parent_id,
        position_x: formData.position_x,
        position_y: formData.position_y,
        subject_id: formData.subject_id || undefined,
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : undefined,
        is_active: formData.is_active,
        prerequisites: formData.prerequisites,
        max_attempts: formData.max_attempts,
        duration_minutes: formData.duration_minutes,
        difficulty: formData.difficulty as "easy" | "medium" | "hard",
        tags: formData.tags,
        image_url: formData.image_url,
        color: formData.color,
      };

      const result: NodeManagementResult = await updateNode(
        parseInt(nodeId),
        updateData,
      );

      if (result.success) {
        alert("Cập nhật node thành công!");
        router.push("/teacher/skill-tree");
      } else {
        alert(`Cập nhật thất bại: ${result.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Đã xảy ra lỗi khi cập nhật node");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RouteProtectedWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Đang tải...</div>
        </div>
      </RouteProtectedWrapper>
    );
  }

  return (
    <RouteProtectedWrapper>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Chỉnh Sửa Node</h1>
            <Button
              variant="outline"
              onClick={() => router.push("/teacher/skill-tree")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Tên node *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  placeholder="Nhập tên node"
                />
              </div>

              <div>
                <Label htmlFor="node_type">Loại node</Label>
                <Select
                  value={formData.node_type}
                  onChange={(e) => handleChange("node_type", e.target.value)}
                >
                  <option value="grade">Khối</option>
                  <option value="subject">Môn học</option>
                  <option value="chapter">Chương</option>
                  <option value="week">Tuần</option>
                  <option value="lesson">Bài học</option>
                  <option value="content">Nội dung</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                placeholder="Mô tả chi tiết về node này"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject_id">Môn học</Label>
                <Select
                  value={formData.subject_id || ""}
                  onChange={(e) =>
                    handleChange(
                      "subject_id",
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="parent_id">Node cha</Label>
                <Select
                  value={formData.parent_id || ""}
                  onChange={(e) =>
                    handleChange(
                      "parent_id",
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                >
                  <option value="">Không có node cha</option>
                  {allNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.title} ({node.node_type})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="xp">XP thưởng</Label>
                <Input
                  id="xp"
                  type="number"
                  value={formData.xp}
                  onChange={(e) => handleChange("xp", parseInt(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position_x">Vị trí X</Label>
                <Input
                  id="position_x"
                  type="number"
                  value={formData.position_x}
                  onChange={(e) =>
                    handleChange("position_x", parseInt(e.target.value))
                  }
                  min="0"
                  placeholder="500"
                />
              </div>

              <div>
                <Label htmlFor="position_y">Vị trí Y</Label>
                <Input
                  id="position_y"
                  type="number"
                  value={formData.position_y}
                  onChange={(e) =>
                    handleChange("position_y", parseInt(e.target.value))
                  }
                  min="0"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/teacher/skill-tree")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </RouteProtectedWrapper>
  );
}

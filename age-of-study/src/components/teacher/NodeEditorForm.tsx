import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { X, Save, Trash2 } from "lucide-react";
import { NodeData, createNode, updateNode, deleteNode, NodeManagementResult } from "@/lib/nodeManagement";
import { Subject } from "@/types/teacher";
import { Node } from "@/lib/gradeSkillTreeService";

interface NodeEditorFormProps {
  selectedNode: Node | null;
  subjects: Subject[];
  allNodes: Node[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NodeEditorForm: React.FC<NodeEditorFormProps> = ({
  selectedNode,
  subjects,
  allNodes,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<NodeData>(
    selectedNode ? (selectedNode as unknown as NodeData) : {
      id: 0,
      title: "",
      description: "",
      xp: 0,
      node_type: "lesson",
      parent_id: null,
      position_x: 500,
      position_y: 100,
      class_id: undefined,
      subject_id: undefined,
      grade_id: undefined,
      is_active: true,
      prerequisites: [],
      max_attempts: 1,
      duration_minutes: 30,
      difficulty: "easy",
      tags: [],
      image_url: "",
      color: "#6b7280",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChange = (field: keyof NodeData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let result: NodeManagementResult;
      
      if (selectedNode && typeof selectedNode.id === 'number') {
        // Update existing node
        result = await updateNode(selectedNode.id, formData);
      } else {
        // Create new node
        result = await createNode(formData);
      }
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(`Thất bại: ${result.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Đã xảy ra lỗi khi lưu node");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    
    if (!confirm("Bạn có chắc chắn muốn xóa node này? Hành động này không thể hoàn tác.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await deleteNode(typeof selectedNode.id === 'number' ? selectedNode.id : 0);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(`Xóa thất bại: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting node:", error);
      alert("Đã xảy ra lỗi khi xóa node");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {selectedNode ? "Chỉnh Sửa Node" : "Tạo Node Mới"}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Tên bài học/chủ đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="node_type">Loại Node</Label>
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
          
          <div>
            <Label htmlFor="subject_id">Môn học</Label>
            <Select
              value={formData.subject_id || ""}
              onChange={(e) => handleChange("subject_id", parseInt(e.target.value))}
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
            <Label htmlFor="parent_node_id">Node cha (nối nhánh)</Label>
            <Select
              value={formData.parent_id || ""}
              onChange={(e) => handleChange("parent_id", e.target.value ? parseInt(e.target.value) : null)}
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
            <Label htmlFor="required_xp">XP yêu cầu</Label>
            <Input
              id="required_xp"
              type="number"
              value={formData.xp}
              onChange={(e) => handleChange("xp", parseInt(e.target.value))}
              min="0"
            />
          </div>
          
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            
            {selectedNode && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                variant="outline"
                className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Đang xóa..." : "Xóa Node"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeEditorForm;

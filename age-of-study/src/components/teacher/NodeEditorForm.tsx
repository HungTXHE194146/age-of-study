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
import { NotebookButton } from "@/components/ui/notebook-card";

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
      parent_node_id: null,
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

  // Sync form data when selected node changes
  React.useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode as unknown as NodeData);
    } else {
      setFormData({
        id: 0,
        title: "",
        description: "",
        xp: 0,
        node_type: "lesson",
        parent_node_id: null,
        position_x: 500,
        position_y: 100,
        is_active: true,
        max_attempts: 1,
        duration_minutes: 30,
        difficulty: "easy",
        color: "#6b7280",
      });
    }
  }, [selectedNode, isOpen]);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#fffdf8] border-4 border-black rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden relative">
        <div className="bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] p-6 border-b-2 border-dashed border-gray-300 flex items-start justify-between">
          <div>
            <h3 className="text-4xl font-black text-gray-900 font-handwritten tracking-tight shadow-sm">
              {selectedNode ? "Chỉnh Sửa Bài Học" : "Tạo Bài Học Mới"}
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-bold">
              Cấu hình thông tin chi tiết
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-black shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
          <div>
            <Label htmlFor="title" className="text-gray-800 font-bold text-sm uppercase mb-1 block">Tên bài học/chủ đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              required
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-800 font-bold text-sm uppercase mb-1 block">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="node_type" className="text-gray-800 font-bold text-sm uppercase mb-1 block">Loại bài học</Label>
            <select
              id="node_type"
              value={formData.node_type}
              onChange={(e) => handleChange("node_type", e.target.value)}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <option value="grade">Khối</option>
              <option value="subject">Môn học</option>
              <option value="chapter">Chương</option>
              <option value="week">Tuần</option>
              <option value="lesson">Bài học</option>
              <option value="content">Nội dung</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="subject_id" className="text-gray-800 font-bold text-sm uppercase mb-1 block">Thuộc môn học</Label>
            <select
              id="subject_id"
              value={formData.subject_id || ""}
              onChange={(e) => handleChange("subject_id", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="parent_node_id" className="text-gray-800 font-bold text-sm uppercase mb-1 block">Bài học đứng trước (Node cha)</Label>
            <select
              id="parent_node_id"
              value={formData.parent_node_id || ""}
              onChange={(e) => handleChange("parent_node_id", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <option value="">Không có bài học đứng trước</option>
              {allNodes.filter(n => n.id !== selectedNode?.id).map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title} ({node.node_type})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-blue-600 font-bold mt-1 italic">Giúp tạo liên kết mũi tên trên bản đồ.</p>
          </div>
          
          <div>
            <Label htmlFor="required_xp" className="text-gray-800 font-bold text-sm uppercase mb-1 block">XP yêu cầu</Label>
            <Input
              id="required_xp"
              type="number"
              value={formData.xp}
              onChange={(e) => handleChange("xp", parseInt(e.target.value))}
              className="w-full bg-white border-2 border-black rounded-md px-3 py-2 text-gray-900 font-bold focus:outline-none focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              min="0"
            />
          </div>
          
          <div className="flex gap-4 pt-4 border-t-2 border-dashed border-gray-300 mt-6">
            <NotebookButton
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-100 text-blue-900 border-blue-900"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? "Đang lưu..." : selectedNode ? "Lưu thay đổi" : "Tạo bài học"}
            </NotebookButton>
            
            {selectedNode && (
              <NotebookButton
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-100 border-red-900 text-red-900"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </NotebookButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeEditorForm;

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              {selectedNode ? "CHỈNH SỬA BÀI HỌC" : "TẠO BÀI HỌC MỚI"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
              Cấu hình thông tin bài học
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
            <Label htmlFor="node_type" className="text-indigo-300 font-bold text-xs uppercase mb-2 block">Loại bài học</Label>
            <select
              id="node_type"
              value={formData.node_type}
              onChange={(e) => handleChange("node_type", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Label htmlFor="subject_id" className="text-indigo-300 font-bold text-xs uppercase mb-2 block">Thuộc môn học</Label>
            <select
              id="subject_id"
              value={formData.subject_id || ""}
              onChange={(e) => handleChange("subject_id", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Label htmlFor="parent_node_id" className="text-indigo-300 font-bold text-xs uppercase mb-2 block">Bài học đứng trước (Node cha)</Label>
            <select
              id="parent_node_id"
              value={formData.parent_node_id || ""}
              onChange={(e) => handleChange("parent_node_id", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Không có bài học đứng trước</option>
              {allNodes.filter(n => n.id !== selectedNode?.id).map((node) => (
                <option key={node.id} value={node.id}>
                  {node.title} ({node.node_type})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1 italic italic">Giúp tạo liên kết mũi tên trên bản đồ.</p>
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
          
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-gray-900 border-t border-white/5 mt-auto">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Đang lưu..." : selectedNode ? "Lưu thay đổi" : "Tạo bài học"}
            </Button>
            
            {selectedNode && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                variant="danger"
                className="bg-red-500/20 hover:bg-red-500 border border-red-500/50 text-red-400 hover:text-white transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeEditorForm;

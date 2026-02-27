import React from 'react';

// Định nghĩa interface Node để match với database schema
interface Node {
  id: number;
  title: string;
  description?: string;
  parent_node_id?: number | null;
  node_type: string;
  required_xp: number;
  position_x?: number;
  position_y?: number;
  order_index: number;
  children?: Node[];
}

interface SkillNodeProps {
  node: Node;
  level: number;
  disableRecursion?: boolean;
}

export function SkillNode({ node, level, disableRecursion = false }: SkillNodeProps) {
  // Xác định màu sắc, biểu tượng và kiểu dáng dựa trên node_type
  const getTypeStyle = (nodeType: string) => {
    switch (nodeType.toLowerCase()) {
      case 'subject':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          hoverColor: 'hover:bg-blue-100',
          icon: '📚',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'chapter':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          hoverColor: 'hover:bg-green-100',
          icon: '📖',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'week':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          hoverColor: 'hover:bg-purple-100',
          icon: '📅',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600'
        };
      case 'lesson':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          hoverColor: 'hover:bg-orange-100',
          icon: '🎯',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
      case 'content':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:bg-gray-100',
          icon: '📄',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:bg-gray-100',
          icon: '📄',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const style = getTypeStyle(node.node_type);

  return (
    <div className="space-y-2">
      {/* Đường kẻ dọc nối giữa các node cha và con */}
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-gray-200"
          style={{ 
            left: `${(level - 1) * 24}px`,
            top: '-1rem',
            bottom: '1rem'
          }}
        />
      )}
      
      {/* Node hiện tại */}
      <div 
        className={`
          ${style.bgColor} 
          ${style.borderColor} 
          ${style.hoverColor}
          border-l-4 
          pl-4 
          pr-4 
          py-3 
          rounded-xl 
          hover:shadow-lg 
          hover:scale-[1.02]
          transition-all 
          duration-200
          cursor-pointer
          group
          relative
          overflow-hidden
          border
          hover:border-opacity-100
          border-opacity-50
        `}
        style={{ 
          marginLeft: `${level * 24}px` // Thụt lề theo cấp độ
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${node.title}`}
      >
        {/* Hiệu ứng nền khi hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4 flex-1">
            {/* Icon */}
            <div className={`
              ${style.iconBg} 
              ${style.iconColor}
              w-10 h-10 
              rounded-full 
              flex 
              items-center 
              justify-center 
              text-lg 
              font-bold 
              shadow-sm
              group-hover:scale-110
              transition-transform
              duration-200
            `} aria-hidden="true">
              {style.icon}
            </div>
            
            {/* Nội dung */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${style.color} text-base md:text-lg truncate`}>
                {node.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 capitalize flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.color} ${style.bgColor} border ${style.borderColor}`}>
                    {node.node_type}
                  </span>
                  {node.description && (
                    <span className="text-gray-400">•</span>
                  )}
                  {node.description && (
                    <span className="text-gray-500">{node.description}</span>
                  )}
                </p>
                
                {/* XP Badge */}
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="mr-1">⭐</span>
                    {node.required_xp} XP
                  </span>
                  {node.children && node.children.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                      {node.children.length} sub-items
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Arrow indicator */}
          <div className="ml-4 flex-shrink-0">
            {node.children && node.children.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${style.color} opacity-60`} />
                <span className={`w-2 h-2 rounded-full ${style.color} opacity-40`} />
                <span className={`w-2 h-2 rounded-full ${style.color} opacity-20`} />
              </div>
            )}
          </div>
        </div>
        
        {/* Mô tả chi tiết (ẩn trên mobile, hiện trên desktop) */}
        {node.description && (
          <p className="text-sm text-gray-600 mt-2 ml-14 hidden md:block">
            {node.description}
          </p>
        )}
      </div>

      {/* Render các node con nếu có */}
      {!disableRecursion && node.children && node.children.length > 0 && (
        <div className="relative">
          {/* Đường nối từ node cha đến node con */}
          <div 
            className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-gray-200 opacity-50"
            style={{ 
              left: '12px',
              top: '1rem',
              bottom: '-1rem'
            }}
          />
          
          <div className="ml-6 space-y-2">
            {node.children.map((childNode) => (
              <MemoizedSkillNode
                key={childNode.id}
                node={childNode}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedSkillNode = React.memo(SkillNode);
export default MemoizedSkillNode;
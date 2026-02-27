-- Hàm lấy toàn bộ Cây kỹ năng (Skill Tree) của một môn học
-- Tên hàm: get_skill_tree
-- Tham số đầu vào: p_subject_id bigint
-- Output: Trả về bảng chứa các trường cần thiết từ bảng nodes

CREATE OR REPLACE FUNCTION get_skill_tree(p_subject_id bigint)
RETURNS TABLE(
    id bigint,
    title text,
    description text,
    parent_node_id bigint,
    node_type text,
    required_xp integer,
    position_x integer,
    position_y integer,
    order_index integer
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        n.id,
        n.title,
        n.description,
        n.parent_node_id,
        n.node_type,
        n.required_xp,
        n.position_x,
        n.position_y,
        n.order_index
    FROM nodes n
    WHERE n.subject_id = p_subject_id
    ORDER BY 
        CASE WHEN n.parent_node_id IS NULL THEN 0 ELSE 1 END,
        n.order_index ASC;
$$;

-- Cách sử dụng:
-- SELECT * FROM get_skill_tree(1);
-- 
-- Hoặc trong ứng dụng:
-- const { data, error } = await supabase
--   .rpc('get_skill_tree', { p_subject_id: 1 })
--   .order('order_index', { ascending: true });
import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from '../layoutUtils';
import { Node, Edge } from '@xyflow/react';

describe('layoutUtils', () => {
  it('should calculate positions using vertical zig-zag algorithm', () => {
    const nodes: Node[] = [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
      { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
    ];
    
    // 1 -> 2, 1 -> 3
    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
    ];

    const result = getLayoutedElements(nodes, edges);

    expect(result.nodes.length).toBe(3);
    expect(result.edges.length).toBe(2);

    // Node 1 (Root) should be higher than nodes 2 and 3
    const node1 = result.nodes.find(n => n.id === '1');
    const node2 = result.nodes.find(n => n.id === '2');
    const node3 = result.nodes.find(n => n.id === '3');
    
    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node3).toBeDefined();
    
    if (node1 && node2 && node3) {
      expect(node1.position.y).toBeLessThan(node2.position.y);
      expect(node1.position.y).toBeLessThan(node3.position.y);
      
      // According to the new zig-zag algorithm, children are separated vertically and staggered horizontally
      expect(node2.position.y).not.toEqual(node3.position.y);
      expect(node2.position.y).toBeLessThan(node3.position.y); // node2 is processed before node3 because of id sort
      expect(node2.position.x).not.toEqual(node3.position.x); // they should be staggered
    }
  });
});

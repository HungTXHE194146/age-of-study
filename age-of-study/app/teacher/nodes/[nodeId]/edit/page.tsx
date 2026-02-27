"use client";

import { useParams } from "next/navigation";

export default function EditNodePage() {
  const params = useParams();
  
  return (
    <div>
      <h1>Edit Node {params.nodeId}</h1>
    </div>
  );
}

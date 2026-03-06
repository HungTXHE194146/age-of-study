import React from "react";
import { NodeCallbacksContextType } from "./types";

export const NodeCallbacksContext = React.createContext<NodeCallbacksContextType>({
  isTeacherMode: false,
});

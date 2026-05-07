// Mirror of apps/backend/app/schemas/interpret.py
// Keep these in sync when you change the backend contract.

export type InterpretMode = "dynamic_ui" | "agentic_simulation" | "auto";

export type ComponentType =
  | "card"
  | "chart"
  | "table"
  | "timeline"
  | "simulation_panel";

export type ActionType = "tool_call" | "agent_action" | "ui_action";

export interface Component {
  type: ComponentType;
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export interface Action {
  type: ActionType;
  name: string;
  arguments: Record<string, unknown>;
}

export interface InterpretRequest {
  prompt: string;
  mode: InterpretMode;
}

export interface InterpretResponse {
  summary: string;
  intent: string;
  mode: InterpretMode;
  components: Component[];
  actions: Action[];
  raw_model_output: Record<string, unknown>;
  is_mock: boolean;
}

import modelJson from './cognitive_difficulty_model.json' with { type: 'json' };

// Auto-generated export of trained cognitive difficulty model
export interface CognitiveModelConfigType {
  model_type: string;
  version: string;
  description: string;
  architecture: {
    input_dim: number;
    hidden_dim: number;
    output_dim: number;
    hidden_activation: string;
    output_activation: string;
  };
  feature_names: string[];
  cognitive_domains: Record<string, number>;
  classes: number[];
  scaler: {
    mean: number[];
    scale: number[];
  };
  weights: {
    layer_1_weights: number[][];
    layer_1_biases: number[];
    layer_2_weights: number[][];
    layer_2_biases: number[];
  };
  metrics?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const COGNITIVE_MODEL_CONFIG: CognitiveModelConfigType = modelJson as unknown as CognitiveModelConfigType;

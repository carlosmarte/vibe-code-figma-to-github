export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified: string;
  version?: string;
  document?: FigmaDocument;
  components?: Record<string, FigmaComponent>;
  schemaVersion?: number;
  styles?: Record<string, any>;
}

export interface FigmaDocument {
  id: string;
  name: string;
  type: string;
  children: FigmaNode[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: Rectangle;
  constraints?: LayoutConstraint;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  effects?: Effect[];
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  documentationLinks: string[];
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConstraint {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';
  visible?: boolean;
  opacity?: number;
  color?: Color;
  blendMode?: BlendMode;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Effect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius?: number;
  color?: Color;
  blendMode?: BlendMode;
  offset?: Vector;
}

export interface Vector {
  x: number;
  y: number;
}

export type BlendMode = 
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface FigmaComment {
  id: string;
  user: FigmaUser;
  message: string;
  client_meta?: Vector;
  file_key: string;
  parent_id?: string;
  created_at: string;
  resolved_at?: string;
  reactions?: FigmaReaction[];
}

export interface FigmaReaction {
  user: FigmaUser;
  emoji: string;
  created_at: string;
}

export interface FigmaVersion {
  id: string;
  created_at: string;
  label?: string;
  description?: string;
  user: FigmaUser;
}

export interface FigmaTeam {
  id: string;
  name: string;
  img_url?: string;
}

export interface FigmaProject {
  id: string;
  name: string;
  team_id?: string;
}
export type SessionStatus = "in_progress" | "paused" | "completed" | "cancelled";

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full_body";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "other";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  weight_unit: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment_type: EquipmentType;
  description: string | null;
  is_system: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  status: SessionStatus;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  exercise?: Exercise;
}

export interface WorkoutSet {
  id: string;
  workout_session_exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
  is_warmup: boolean;
  completed_at: string;
  created_at: string;
}

export interface ActiveWorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipmentType: EquipmentType;
  sortOrder: number;
  sets: ActiveWorkoutSet[];
}

export interface ActiveWorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
  isWarmup: boolean;
  completedAt: string;
}

export interface ActiveWorkout {
  id: string;
  userId: string;
  templateId: string | null;
  status: SessionStatus;
  startedAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  exercises: ActiveWorkoutExercise[];
}

export type SyncStatus = "saved" | "saving" | "offline" | "error";

export interface PendingMutation {
  id: string;
  table: string;
  operation: "upsert" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
}

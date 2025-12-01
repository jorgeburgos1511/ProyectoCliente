import { Schema, model, models } from "mongoose";

export interface IGoal {
  title: string;
  progress: number; // 0..100
  projectId?: string;
  ownerId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true, trim: true },
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    projectId: { type: String },
    ownerId: { type: String },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Goal = models.Goal || model<IGoal>("Goal", GoalSchema);

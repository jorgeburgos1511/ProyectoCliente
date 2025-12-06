import { Schema, model, models } from "mongoose";

export interface ISprint {
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  completed?: boolean;
  members?: string[]; // usuarios asignados al sprint
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    goal: { type: String },
    completed: { type: Boolean, default: false },
    members: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Simple validator: startDate <= endDate
SprintSchema.pre("validate", function (next) {
  const s = (this as any).startDate as Date | undefined;
  const e = (this as any).endDate as Date | undefined;
  if (s && e && s.getTime() > e.getTime()) {
    return next(new Error("startDate debe ser menor o igual que endDate"));
  }
  next();
});

export const Sprint = models.Sprint || model<ISprint>("Sprint", SprintSchema);

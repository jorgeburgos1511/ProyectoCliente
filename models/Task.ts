import { Schema, model, models } from "mongoose";

export type TaskStatus = "Todo" | "Doing" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export interface ITask {
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  points?: number;
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Todo", "Doing", "Done"],
      required: true,
      default: "Todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
      index: true,
    },
    assigneeId: { type: String },
    dueDate: { type: Date },
    points: { type: Number, min: 0 },
    tags: { type: [String], default: [] },
    description: { type: String },
  },
  { timestamps: true }
);

export const Task = models.Task || model<ITask>("Task", TaskSchema);

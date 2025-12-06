import { Schema, model, models } from "mongoose";

export interface IProject {
  name: string;
  key: string;
  ownerId: string;
  members: string[];
  dueDate?: Date;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 2,
      maxlength: 6,
    },
    ownerId: { type: String, required: true },
    members: { type: [String], required: true, default: [] },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Project =
  models.Project || model<IProject>("Project", ProjectSchema);

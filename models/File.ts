// models/File.ts
import {
  Schema,
  model,
  models,
  Types,
  Document,
  Model,
} from "mongoose";

export interface IFile extends Document {
  projectId: Types.ObjectId | string;
  key: string;
  url: string;
  originalName: string;
  size: number;
  contentType?: string;      // opcional, por si lo quieres guardar
  uploadedBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    contentType: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// 👇 Esta es la parte importante: nada de ReturnType ni cosas raras
export const FileModel: Model<IFile> =
  (models.File as Model<IFile>) || model<IFile>("File", FileSchema);


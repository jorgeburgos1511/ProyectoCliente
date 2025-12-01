require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Falta MONGODB_URI en las variables de entorno");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "manager", "developer"],
      default: "developer",
    },
    provider: {
      type: String,
      enum: ["credentials", "google", "manual"],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB\n");

    const email = "admin@taskflow.com";
    const password = "admin123";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Ya existe un usuario con ese correo, no se crea otro.");
      console.log(existing);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: "Administrador",
      email,
      password: hashed,
      role: "admin",
      provider: "credentials",
    });

    console.log("Usuario admin creado correctamente:");
    console.log(admin);
    console.log("\nPuedes iniciar sesión con:");
    console.log(`   Correo: ${email}`);
    console.log(`   Contraseña: ${password}`);

    process.exit(0);
  } catch (err) {
    console.error("Error creando el admin:", err);
    process.exit(1);
  }
}

createAdmin();

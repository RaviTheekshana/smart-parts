import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connect from "./config/db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

await connect();

app.use("/api/auth", (await import("./routes/auth.js")).default);
app.use("/api/vehicles", (await import("./routes/vehicles.js")).default);
app.use("/api/parts", (await import("./routes/parts.js")).default);
app.use("/api/cart", (await import("./routes/cart.js")).default);
app.use("/api/orders", (await import("./routes/orders.js")).default);
app.use("/api", (await import("./routes/community.js")).default);
app.use("/api/admin", (await import("./routes/admin.js")).default);

app.use("/api/posts", (await import("./routes/posts.js")).default);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server listening on", port));

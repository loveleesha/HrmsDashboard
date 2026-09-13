require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const errorHandler = require("./middleware/errorHandler");
const responseFormatter = require("./middleware/responseFormatter");
const openapiSpec = require("./swagger/openapi");
const { PROFILE_PICTURES_DIR } = require("./utils/upload");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(responseFormatter);

// Profile pictures are low-sensitivity, served publicly by filename (unguessable, random).
// Documents (PAN, Aadhaar, etc.) are never served statically — only via the authenticated
// /api/employees/:id/documents/:docId/download route.
app.use("/uploads/profile-pictures", express.static(PROFILE_PICTURES_DIR));

// Swagger UI needs inline <script>/<style> to render — relax CSP only for this path,
// the rest of the app keeps helmet's strict default.
app.use(
  "/api-docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec)
);

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

app.use(errorHandler);

module.exports = app;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const responseFormatter = require("./middleware/responseFormatter");
const openapiSpec = require("./swagger/openapi");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(responseFormatter);

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

app.use(errorHandler);

module.exports = app;

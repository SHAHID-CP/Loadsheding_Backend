import CookieParser from "cookie-parser";
import cors from "cors";
import express, {type Application,type Request,type Response,} from "express";
import helmet from "helmet";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { routes } from "./app/routes";

const app: Application = express();


app.use(helmet());
app.use(cors({origin:[config.frontend_url,"http://localhost:3000","http://127.0.0.1:3000"],credentials : true,}),);
// app.post("/api/payments/confirm",express.raw({ type: "application/json" }),paymentController.handleStripeWebhook);
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success:true,
    message: "Welcome to Loadsheding Management System Backend",
	data:null
  });
});

app.use('/api/v1',routes);

app.use(globalErrorHandler);
app.use(notFound);

export default app;

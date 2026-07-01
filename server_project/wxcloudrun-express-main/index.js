const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = morgan("tiny");

const userRouter = require("./routes/user")
const vipUserCardRouter = require("./routes/vip_user_card")
const managerCardRouter = require("./routes/manager_card")

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use("/user", userRouter)
app.use("/vip_user_card", vipUserCardRouter)
app.use("/manager_card", managerCardRouter)
app.use(logger);

const port = process.env.PORT || 80;

async function bootstrap() {
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();

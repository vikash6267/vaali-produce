const express = require("express")
const app = express();
const cookieParser = require("cookie-parser")
const cors = require("cors")
const { cloudinaryConnect } = require("./config/cloudinary")
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const Order = require("./models/orderModle")

dotenv.config();

const PORT = process.env.PORT || 8080
connectDB();


app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));

app.use(cookieParser());
app.use(cors({
  origin: "*",
  credentials: true,
}))

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp"
  })
)

cloudinaryConnect();


// routes  
app.use("/api/v1/auth", require("./routes/authRoute"))
app.use("/api/v1/image", require("./routes/imageRoute"))
app.use("/api/v1/category", require("./routes/categoryRoute"))
app.use("/api/v1/product", require("./routes/productRoute"))
app.use("/api/v1/price-list-templates", require("./routes/PriceListTemplateRoute"));
app.use("/api/v1/order", require("./routes/orderRoute"))
app.use("/api/v1/crm", require("./routes/crmRoute"))
app.use("/api/v1/crm-deal", require("./routes/dealCrmRoute"))
app.use("/api/v1/task", require("./routes/taskRoute"))
app.use("/api/v1/email", require("./routes/emailsRoute"))
app.use("/api/v1/pricing", require("./routes/groupPricing"))
app.use("/api/v1/vendors", require("./routes/vendorRoute"))
app.use("/api/v1/purchase-orders", require("./routes/purchaseOrderRoute"))
app.use("/api/v1/credit-memo", require("./routes/creditMemosRoute"))






app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running ..."
  })
})

app.listen(PORT, () => {
  console.log(`Server is running at port no ${PORT}`)
})

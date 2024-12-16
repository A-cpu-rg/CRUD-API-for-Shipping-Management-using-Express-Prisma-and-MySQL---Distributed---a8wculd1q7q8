const express = require("express");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(express.json());

const verifySecret = (req, res, next) => {
  const secretKey = req.headers["shipping_secret_key"];
  const validSecret = process.env.SHIPPING_SECRET_KEY;

  if (!secretKey) {
    return res.status(403).json({ error: "SHIPPING_SECRET_KEY is missing or invalid" });
  }

  if (secretKey !== validSecret) {
    return res.status(403).json({ error: "Failed to authenticate SHIPPING_SECRET_KEY" });
  }

  next();
};

app.use(verifySecret);


app.post("/api/shipping/create", async (req, res) => {
  const { userId, productId, count } = req.body;

  if (!userId || !productId || !count) {
    return res.status(404).json({ error: "All fields required" });
  }

  try {
    const shipping = await prisma.shipping.create({
      data: {
        userId,
        productId,
        count,
        status: "pending",
      },
    });

    res.status(201).json(shipping);
  } catch (error) {
    res.status(500).json({ error: "Failed to create shipping record" });
  }
});

app.put("/api/shipping/cancel", async (req, res) => {
  const { shippingId } = req.body;

  if (!shippingId) {
    return res.status(404).json({ error: "Missing shippingId" });
  }

  try {
    const shipping = await prisma.shipping.update({
      where: { id: shippingId },
      data: { status: "cancelled" },
    });

    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel shipping record" });
  }
});

app.get("/api/shipping/get", async (req, res) => {
  const { userId } = req.query;

  try {
    const shippings = await prisma.shipping.findMany({
      where: userId ? { userId: parseInt(userId) } : {},
    });

    res.status(200).json(shippings);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve shipping records" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Shipping Management API");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

module.exports = app;
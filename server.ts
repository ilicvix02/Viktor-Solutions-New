import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/contact", async (req, res) => {
    const { name, email, phone, message } = req.body;
    
    console.log("Contact form submission received:");
    console.log(`From: ${name} <${email}>`);
    console.log(`Phone: ${phone}`);
    console.log(`Message: ${message}`);

    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn("RESEND_API_KEY is not set. Simulating email send.");
      // Just simulate success if key is missing
      return res.json({ success: true, message: "Your message has been successfully received (Simulation - missing API key)." });
    }

    try {
      const resend = new Resend(resendKey);
      
      const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // Resend free tier requires this specific sender unless you verify a domain
        to: ['ilicvix@gmail.com'],
        subject: `New contact inquiry from: ${name}`,
        html: `
          <h3>New Inquiry from Web Studio</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ success: false, error: "An error occurred while sending the email." });
      }

      res.json({ success: true, message: "Your message was sent successfully. We will contact you shortly!" });
    } catch (err) {
      console.error("Error sending email:", err);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

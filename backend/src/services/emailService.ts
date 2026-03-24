import Imap from "imap";
import { simpleParser } from "mailparser";
import prisma from "../prisma";
import { parseTransaction } from "./emailParser";

export function startEmailReader() {
  const imap = new Imap({
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  imap.once("ready", () => {
    console.log("📧 IMAP connected to Gmail");

    imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        console.error("❌ Error opening INBOX:", err);
        return;
      }

      imap.search(["UNSEEN"], (err, results) => {
        if (err) {
          console.error("❌ Error searching emails:", err);
          return;
        }

        if (!results || results.length === 0) {
          console.log("📭 No emails found, listening for new emails...");
          return;
        }

        console.log(`📬 Found ${results.length} unread email(s)`);

        const f = imap.fetch(results, { bodies: "", markSeen: true });

        f.on("message", (msg) => {
          msg.on("body", async (stream) => {
            try {
              const parsed = await simpleParser(stream);
              const emailText = parsed.text || "";

              console.log("📩 Processing email:", parsed.subject);

              // ส่งข้อความไปให้ parser วิเคราะห์
              const transaction = parseTransaction(emailText);

              // บันทึกลง database เฉพาะข้อความที่ parse จำนวนเงินได้
              if (transaction.amount !== null) {
                // 1. ค้นหาหมวดหมู่ที่เคยจำไว้ด้วย keyword
                let matchedCategory = "uncategorized";
                
                if (transaction.keyword) {
                  // ถ้ามี userId หลายคน อาจจะต้องใส่ userId ของคนที่ผูกบัญชีอีเมลนี้
                  // สมมติว่าตอนนี้ดึงของคนที่มี userId = 1 ไปก่อน หรือถ้ามีผู้ใช้เดียวก็หาแบบ first()
                  // ถ้าใช้งานจริง ควรดึง userId จากคนที่ตั้งค่าอีเมลนี้ไว้
                  const mapping = await prisma.categoryMapping.findFirst({
                    where: { 
                      keyword: {
                        contains: transaction.keyword,
                        mode: "insensitive" // ค้นหาแบบไม่สนใจตัวพิมพ์เล็กใหญ่
                      } 
                    }
                  });
                  
                  if (mapping) {
                    matchedCategory = mapping.category;
                    console.log(`🧠 Found saved category mapping: [${transaction.keyword}] -> ${matchedCategory}`);
                  } else {
                    const pastTx = await prisma.transaction.findFirst({
                      where: {
                        keyword: transaction.keyword,
                        category: { not: "uncategorized" }
                      },
                      orderBy: { createdAt: "desc" }
                    });
                    if (pastTx && pastTx.category) {
                      matchedCategory = pastTx.category;
                      console.log(`🧠 Found past transaction category: [${transaction.keyword}] -> ${matchedCategory}`);
                    }
                  }
                }

                const saved = await prisma.transaction.create({
                  data: {
                    rawEmail: emailText,
                    amount: transaction.amount,
                    type: transaction.type,
                    bank: transaction.bank,
                    keyword: transaction.keyword, // เพิ่ม keyword ลงตาราง Transaction ด้วย
                    category: matchedCategory, // ใช้ category ที่เจอจากความจำ (หรือ uncategorized ถ้าไม่เจอ)
                  },
                });

                console.log("✅ Transaction saved:", saved.id, {
                  amount: saved.amount,
                  type: saved.type,
                  category: saved.category
                });
              } else {
                console.log("ℹ️ Skipped (Not a valid transaction email):", parsed.subject);
              }
            } catch (error) {
              console.error("❌ Error processing email:", error);
            }
          });
        });

        f.once("error", (err: Error) => {
          console.error("❌ Fetch error:", err);
        });

        f.once("end", () => {
          console.log("📧 Done fetching historical emails");
        });
      });

      // Listen for new incoming emails while connection is kept alive
      imap.on("mail", (numNewMsgs) => {
        console.log(`📬 Received ${numNewMsgs} new email(s)! Fetching...`);
        // Fetch only the newly arrived unread emails
        imap.search(["UNSEEN"], (err, results) => {
          if (err || !results || results.length === 0) return;

          const f = imap.fetch(results, { bodies: "", markSeen: true });
          f.on("message", (msg) => {
            msg.on("body", async (stream) => {
               try {
                 const parsed = await simpleParser(stream);
                 const emailText = parsed.text || "";
                 console.log("📩 Processing new email:", parsed.subject);
                   const transaction = parseTransaction(emailText);
                 
                 if (transaction.amount !== null) {
                   // 1. ค้นหาหมวดหมู่ที่เคยจำไว้ด้วย keyword
                   let matchedCategory = "uncategorized";
                   
                   if (transaction.keyword) {
                     const mapping = await prisma.categoryMapping.findFirst({
                       where: { 
                         keyword: {
                           contains: transaction.keyword,
                           mode: "insensitive"
                         } 
                       }
                     });
                     
                     if (mapping) {
                       matchedCategory = mapping.category;
                       console.log(`🧠 Found saved category mapping (new email): [${transaction.keyword}] -> ${matchedCategory}`);
                     } else {
                        const pastTx = await prisma.transaction.findFirst({
                          where: {
                            keyword: transaction.keyword,
                            category: { not: "uncategorized" }
                          },
                          orderBy: { createdAt: "desc" }
                        });
                        if (pastTx && pastTx.category) {
                          matchedCategory = pastTx.category;
                          console.log(`🧠 Found past transaction category (new email): [${transaction.keyword}] -> ${matchedCategory}`);
                        }
                     }
                   }

                   const saved = await prisma.transaction.create({
                     data: {
                       rawEmail: emailText,
                       amount: transaction.amount,
                       type: transaction.type,
                       bank: transaction.bank,
                       keyword: transaction.keyword,
                       category: matchedCategory,
                     },
                   });
                   console.log("✅ New transaction saved:", saved.id, { amount: saved.amount, type: saved.type, category: saved.category });
                 } else {
                   console.log("ℹ️ Skipped new email (Not a transaction):", parsed.subject);
                 }
               } catch (e) { console.error(e) }
            });
          });
        });
      });
    });
  });

  imap.once("error", (err: Error) => {
    console.error("❌ IMAP connection error:", err);
    // Timeout or disconnect error, let's reconnect automatically after a delay
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect IMAP...");
      startEmailReader();
    }, 10000); // Reconnect in 10 seconds
  });

  imap.once("end", () => {
    console.log("📧 IMAP connection ended, attempting to reconnect...");
    setTimeout(() => {
      startEmailReader();
    }, 10000); // Reconnect in 10 seconds
  });

  try {
    imap.connect();
  } catch (err) {
    console.error("❌ IMAP initial connection failed:", err);
    setTimeout(() => startEmailReader(), 10000);
  }
}
export interface ParsedTransaction {
  amount: number | null;
  type: string | null;
  bank: string;
  keyword: string | null;
}

export function parseTransaction(emailText: string): ParsedTransaction {
  let amount: number | null = null;
  let type: string | null = null;
  const bank = "krungthai";
  let keyword: string | null = null;

  // ดึงจำนวนเงิน: รองรับรูปแบบ "จำนวนเงิน : 1.00 บาท" หรือรูปแบบอื่นๆ ที่มีตัวเลขก่อน "บาท"
  const amountMatch = emailText.match(/(?:จำนวนเงิน\s*:\s*)?([\d,]+(\.\d+)?)\s*บาท/);
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }

  // ตรวจสอบประเภท: income หรือ expense
  if (emailText.includes("ได้รับเงิน") || emailText.includes("เงินเข้า")) {
    type = "income";
  } else if (emailText.includes("โอนเงิน") || emailText.includes("หักเงิน") || emailText.includes("ชำระเงิน")) {
    type = "expense";
  }
  
  // 🟢 ดึง Keyword (ชื่อผู้โอน/ผู้รับโอน หรือ ผู้ให้บริการ)
  // สมมติฐาน: ในอีเมลมีระบุว่า "จาก: นาย ธีรภัทร จินดาคำ" หรือ "ไปยัง: SHOPEEPAY"
  // ต้องปรับ Regex นี้ให้ตรงกับรูปแบบอีเมลแจ้งเตือนของธนาคารจริงๆ
  const fromMatch = emailText.match(/จาก\s*:\s*([^\n]+)/);
  const toMatch = emailText.match(/ไปยัง\s*:\s*([^\n]+)/);
  
  if (type === "income" && fromMatch && fromMatch[1]) {
      keyword = fromMatch[1].trim();
  } else if (type === "expense" && toMatch && toMatch[1]) {
      keyword = toMatch[1].trim();
  } else {
      // กรณีหาไม่เจอตามดัก ลองใช้วิธีหาชื่อบริษัทหรือชื่อคนแบบคร่าวๆ 
      // หรือเก็บเป็น null ไปก่อนให้ผู้ใช้มาระบุเอง
  }

  return { amount, type, bank, keyword };
}

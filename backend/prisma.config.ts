import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  datasource: {
    // ใช้ env() ที่ import มาจาก @prisma/config
    url: env("DIRECT_URL"), 
  },
});
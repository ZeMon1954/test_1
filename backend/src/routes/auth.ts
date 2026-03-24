import 'dotenv/config';
import { Router } from 'express';
import { register, login } from '../controllers/authController';
import axios from 'axios';
const router = Router();

// 📝 สมัครสมาชิก
router.post('/register', register);

// 🔐 เข้าสู่ระบบ
router.post('/login', login);

router.get("/stats/:name/:tag", async (req,res)=>{

    const {name,tag} = req.params

    try{

        const response = await axios.get(
            `https://api.henrikdev.xyz/valorant/v3/matches/ap/${name}/${tag}`,
            {
                headers: {
                    Authorization: process.env.HENRIK_API_KEY || ''
                }
            }
        )

        res.json(response.data)

    }catch(error: any){

        console.log("API Error:", error.response?.status, error.response?.data || error.message)

        res.status(error.response?.status || 500).json({
            error: "cannot fetch stats",
            detail: error.response?.data || error.message
        })

    }

})

export default router;

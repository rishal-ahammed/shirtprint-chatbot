const path = require('path'); // Add this at the top
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Company Data
const COMPANY_DATA = {
    name: "ShirtPrint Co.",
    location: "Kochi, Kerala, India",
    physicalAddress: "123 MG Road, Kochi - 682016",
    pricing: [
        { size: "Small", price: "Rs.199", description: "Ideal for kids & teens" },
        { size: "Medium", price: "Rs.299", description: "Standard adult size" },
        { size: "Large", price: "Rs.399", description: "Oversized & premium fit" }
    ],
    returnPolicy: {
        window: "10 days from delivery",
        condition: "Unused, unwashed, original packaging"
    }
};

// System Prompt
const SYSTEM_PROMPT = `You are a customer support assistant for ${COMPANY_DATA.name}. STRICTLY follow:
1. COMPANY INFORMATION:
   - Name: ${COMPANY_DATA.name}
   - Location: ${COMPANY_DATA.location}
   - Address: ${COMPANY_DATA.physicalAddress}
   - Pricing: ${COMPANY_DATA.pricing.map(p => `${p.size}: ${p.price} (${p.description})`).join(', ')}
   - Return Policy: ${Object.entries(COMPANY_DATA.returnPolicy).map(([k,v]) => `${k}: ${v}`).join(', ')}

2. RULES:
   - ONLY answer questions about the company's products, policies, location, or services.
   - For location queries: Always mention "${COMPANY_DATA.physicalAddress}".
   - For unrelated questions: "I only handle queries about ${COMPANY_DATA.name}'s shirt printing services in Kochi."
   - Be concise and mention prices in INR.`;


// Add this before your API routes
app.use(express.static(path.join(__dirname, '../frontend/public')));


// Add a catch-all route to serve index.html
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
  });


// API Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.SITE_URL,
                'X-Title': process.env.SITE_NAME,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: message }
                ],
                temperature: 0.3,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Failed to process your request" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
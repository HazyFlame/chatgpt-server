import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export default async function handler(req, res) {
  const { messages, model } = req.body;

  // Determine type based on model prefix
  let type = 'openai';
  if (model.startsWith('claude')) {
    type = 'claude';
  } else if (model.startsWith('deepseek')) {
    type = 'deepseek';
  }

  try {
    const apiConfig = {
      openai: {
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      },
      deepseek: {
        url: "https://api.deepseek.com/chat/completions",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      },
      claude: {
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "x-api-key": `${process.env.CLAUDE_API_KEY}`,
          "anthropic-version": `${process.env.CLAUDE_API_VERSION}`,
          "Content-Type": "application/json"
        }
      }
    };

    const config = apiConfig[type];
    if (!config) {
      return res.status(400).json({ error: "Invalid type" });
    }

    let requestBody;
    if (type === 'claude') {
      requestBody = {
        model,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        max_tokens: 1024
      };
    } else {
      requestBody = { model, messages };
    }

    const response = await axios.post(
      config.url,
      requestBody,
      { headers: config.headers }
    );

    if (type === 'claude') {
      res.json({
        role: response.data.role,
        content: response.data.content[0].text
      });
    } else {
      // OpenAI and Deepseek format
      res.json(response.data.choices[0].message);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
}
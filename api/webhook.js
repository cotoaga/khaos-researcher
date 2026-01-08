import Joi from 'joi';

// Input validation schema for webhook payload
const webhookSchema = Joi.object({
  discoveries: Joi.array()
    .items(Joi.object({
      type: Joi.string().required(),
      model: Joi.object().required(),
      significance: Joi.number().optional(),
      previous: Joi.object().optional()
    }))
    .max(1000)  // Prevent abuse with excessive data
    .required(),
  source: Joi.string()
    .max(100)
    .required(),
  timestamp: Joi.date().optional()
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const { error: validationError, value: validatedBody } = webhookSchema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    const { discoveries, source } = validatedBody;
    
    console.log(`📢 Webhook received: ${discoveries?.length || 0} discoveries from ${source}`);
    
    // Here you would send to Discord, Slack, etc.
    if (process.env.DISCORD_WEBHOOK_URL && discoveries?.length > 0) {
      await sendDiscordNotification(discoveries);
    }
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      discoveries: discoveries?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function sendDiscordNotification(discoveries) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    content: `🗡️ **KHAOS-Researcher Alert**`,
    embeds: [{
      title: `${discoveries.length} New AI Model${discoveries.length > 1 ? 's' : ''} Discovered!`,
      color: 0x4ECDC4,
      fields: discoveries.slice(0, 5).map(d => ({
        name: d.model?.id || d.id || 'Unknown Model',
        value: `Provider: ${d.model?.provider || d.provider || 'Unknown'}\nCapabilities: ${(d.model?.capabilities || d.capabilities || []).join(', ') || 'Unknown'}`,
        inline: true
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'KHAOS-Researcher v1.0 | Vercel Cloud'
      }
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Discord webhook failed:', response.statusText);
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}
import Groq from 'groq-sdk';

import config from '../config';

const groqApiKey = config.ai.apiKey;

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const getChatCompletion = async (
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
) => {
  if (!groq) {
    return '';
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
  });

  return completion.choices?.[0]?.message?.content || '';
};

export default getChatCompletion;

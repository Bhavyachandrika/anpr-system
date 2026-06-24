export type Role = "system" | "user" | "assistant" | "tool" | "function";
export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: string } };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type MessageContent = string | TextContent | ImageContent | FileContent;
export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};
export type InvokeParams = {
  messages: Message[];
  response_format?: any;
  responseFormat?: any;
  maxTokens?: number;
  max_tokens?: number;
  model?: string;
  [key: string]: any;
};
export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string };
    finish_reason: string | null;
  }>;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const messages = params.messages.map(m => {
    const contents = Array.isArray(m.content) ? m.content : [m.content];
    const parts: any[] = [];

    for (const c of contents) {
      if (typeof c === "string") {
        parts.push({ type: "text", text: c });
      } else if (c.type === "text") {
        parts.push({ type: "text", text: c.text });
      } else if (c.type === "image_url") {
        parts.push({ type: "image_url", image_url: { url: (c as ImageContent).image_url.url } });
      }
    }

    return {
      role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
      content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts,
    };
  });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  return await response.json() as InvokeResult;
}

export async function listLLMModels() {
  return { object: "list", data: [{ id: "llama-4-scout-17b", object: "model", created: 0, owned_by: "meta" }] };
}
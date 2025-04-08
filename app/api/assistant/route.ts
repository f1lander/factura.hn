import { Anthropic } from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

// Define types
interface RequestBody {
  query: string;
  userId: string;
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Cache for embedder to improve performance
let embedder: any = null;

export async function POST(req: Request) {
  try {
    const { query, userId }: RequestBody = await req.json();
    
    // Get response from assistant
    const response = await getAssistantResponse(query, userId);
    
    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getAssistantResponse(userQuery: string, userId: string): Promise<string> {
  // 1. Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
  });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || '');
  
  // 2. Generate embedding for the query (with caching)
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const queryEmbedding = await embedder(userQuery, { pooling: 'mean', normalize: true });
  
  // 3. Query Pinecone for relevant documents
  const queryResponse = await index.query({
    vector: Array.from(queryEmbedding.data),
    topK: 3,
    includeMetadata: true,
  });
  
  // 4. Extract context from results
  const contextDocs = queryResponse.matches.map(match => match.metadata.text);
  const context = contextDocs.join('\n\n');
  
  // 5. Get response from Claude
  const systemPrompt = `You are an AI assistant for an invoicing SaaS application. 
    Answer questions based on the context provided. If you don't know the answer
    based on the context, say so politely and offer to connect the user with support.
    
    Context information:
    ${context}`;
  
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    system: systemPrompt,
    max_tokens: 1000,
    messages: [
      { role: 'user', content: userQuery }
    ]
  });
  
  return message.content[0].text;
} 
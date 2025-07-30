import OpenAI from 'openai';

// Custom message types to replace LangChain message types
export interface BaseMessage {
  content: string;
  type: string;
  timestamp?: number;
}

export class HumanMessage implements BaseMessage {
  content: string;
  type: string;
  timestamp: number;

  constructor(content: string) {
    this.content = content;
    this.type = 'human';
    this.timestamp = Date.now();
  }

  _getType(): string {
    return 'human';
  }
}

export class AIMessage implements BaseMessage {
  content: string;
  type: string;
  timestamp: number;

  constructor(content: string) {
    this.content = content;
    this.type = 'ai';
    this.timestamp = Date.now();
  }

  _getType(): string {
    return 'ai';
  }
}

export class SystemMessage implements BaseMessage {
  content: string;
  type: string;
  timestamp: number;

  constructor(content: string) {
    this.content = content;
    this.type = 'system';
    this.timestamp = Date.now();
  }

  _getType(): string {
    return 'system';
  }
}

// Document interface for vector storage
export interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

// In-memory vector store implementation
export class MemoryVectorStore {
  private documents: Document[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  async addDocuments(docs: Document[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  async addDocument(doc: Document): Promise<void> {
    this.documents.push(doc);
    
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: doc.pageContent,
      });
      
      if (response.data && response.data[0] && response.data[0].embedding) {
        this.embeddings.set(doc.pageContent, response.data[0].embedding);
      }
    } catch (error) {
      console.warn('Failed to create embedding for document:', error);
    }
  }

  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    if (this.documents.length === 0) {
      return [];
    }

    try {
      const queryResponse = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });

      if (!queryResponse.data || !queryResponse.data[0] || !queryResponse.data[0].embedding) {
        // Fallback to simple text matching
        return this.documents
          .filter(doc => doc.pageContent.toLowerCase().includes(query.toLowerCase()))
          .slice(0, k);
      }

      const queryEmbedding = queryResponse.data[0].embedding;
      const similarities: { doc: Document; similarity: number }[] = [];

      for (const doc of this.documents) {
        const docEmbedding = this.embeddings.get(doc.pageContent);
        if (docEmbedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
          similarities.push({ doc, similarity });
        }
      }

      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, k).map(item => item.doc);
    } catch (error) {
      console.warn('Error during similarity search:', error);
      // Fallback to simple text matching
      return this.documents
        .filter(doc => doc.pageContent.toLowerCase().includes(query.toLowerCase()))
        .slice(0, k);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDocuments(): Document[] {
    return [...this.documents];
  }
}

// Buffer memory implementation
export class BufferMemory {
  private messages: BaseMessage[] = [];
  private maxMessages: number;

  constructor(options: { maxMessages?: number } = {}) {
    this.maxMessages = options.maxMessages || 50;
  }

  addMessage(message: BaseMessage): void {
    this.messages.push(message);
    
    // Keep only the last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  addMessages(messages: BaseMessage[]): void {
    messages.forEach(msg => this.addMessage(msg));
  }

  getMessages(): BaseMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  async loadMemoryVariables(): Promise<{ chat_history: BaseMessage[] }> {
    return { chat_history: this.getMessages() };
  }
}

// Vector store retriever memory
export class VectorStoreRetrieverMemory {
  private vectorStore: MemoryVectorStore;
  private memoryKey: string;
  private k: number;

  constructor(vectorStore: MemoryVectorStore, options: { memoryKey?: string; k?: number } = {}) {
    this.vectorStore = vectorStore;
    this.memoryKey = options.memoryKey || 'context';
    this.k = options.k || 5;
  }

  async saveContext(inputs: Record<string, any>, outputs: Record<string, any>): Promise<void> {
    const document: Document = {
      pageContent: outputs.output || outputs[Object.keys(outputs)[0]] || '',
      metadata: {
        inputs,
        outputs,
        timestamp: Date.now()
      }
    };
    
    await this.vectorStore.addDocument(document);
  }

  async loadMemoryVariables(inputs: Record<string, any>): Promise<Record<string, string>> {
    const query = inputs.prompt || inputs.input || '';
    if (!query) {
      return { [this.memoryKey]: '' };
    }

    const docs = await this.vectorStore.similaritySearch(query, this.k);
    const context = docs.map(doc => doc.pageContent).join('\n\n');
    
    return { [this.memoryKey]: context };
  }
}
import OpenAI from 'openai';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  BufferMemory,
  VectorStoreRetrieverMemory,
  MemoryVectorStore,
  Document
} from './openai-memory';

const COMPACTION_PROMPT = `
You are a memory compaction assistant. Condense the following chat history into a single, concise summary.
This summary will be stored in a long-term memory vector store.

Current conversation:
{chat_history}

Concise Summary:
`;

export interface SerializedMemory {
  stm: BaseMessage[];
  ltm_documents: [string, Document][];
}

export class CombinedMemory {
  private stm: BufferMemory;
  private ltm: VectorStoreRetrieverMemory;
  private client: OpenAI;
  private model: string;
  private temperature: number;

  readonly stm_max_tokens: number;
  private vectorStore: MemoryVectorStore;

  // 检查是否为o1系列模型
  private isO1Model(): boolean {
    return this.model.toLowerCase().includes('o1');
  }

  constructor(
    client: OpenAI,
    config: { stm_max_tokens?: number; model?: string; temperature?: any } = {}
  ) {
    this.client = client;
    this.model = config.model ?? 'gpt-4o';
    this.temperature = parseFloat(config.temperature ?? '0.7');
    this.stm_max_tokens = config.stm_max_tokens ?? 8192;

    this.vectorStore = new MemoryVectorStore(client);
    this.ltm = new VectorStoreRetrieverMemory(this.vectorStore, {
      memoryKey: "ltm_context",
      k: 5
    });

    this.stm = new BufferMemory({
      maxMessages: 20
    });
  }

  async addMessage(message: BaseMessage) {
    this.stm.addMessage(message);
    await this.compact();
  }

  async recall(query: string): Promise<{ stm_context: BaseMessage[]; ltm_context: string }> {
    const stm_context = (await this.stm.loadMemoryVariables()).chat_history || [];
    const ltm_context = (await this.ltm.loadMemoryVariables({ prompt: query })).ltm_context || "";
    
    return { stm_context, ltm_context };
  }

  private async compact() {
    const history = await this.stm.loadMemoryVariables();
    const messages: BaseMessage[] = history.chat_history || [];
    
    const tokenCount = messages.reduce((acc: number, msg: BaseMessage) => acc + msg.content.length, 0);

    if (tokenCount > this.stm_max_tokens) {
      console.log(`Compacting memory, token count ${tokenCount} > ${this.stm_max_tokens}`);

      const historyString = messages.map((m) => `${m.type}: ${m.content}`).join('\n');
      // The last message is the most recent context
      const representativeInput = messages[messages.length - 1]?.content || "Memory Summary"; 
      
      try {
        const requestOptions: any = {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: COMPACTION_PROMPT.replace('{chat_history}', historyString)
            }
          ]
        };

        // 只有非o1模型才传递temperature参数
        if (!this.isO1Model()) {
          requestOptions.temperature = this.temperature;
        }

        const response = await this.client.chat.completions.create(requestOptions);

        const summary = response.choices[0]?.message?.content || 'Memory compaction failed';
        
        await this.ltm.saveContext({ input: representativeInput }, { output: summary });
        
        this.stm.clear();
        this.stm.addMessages([
            new HumanMessage("Previous conversation summary"),
            new AIMessage(summary)
        ]);
      } catch (error) {
        console.error('Failed to compact memory:', error);
      }
    }
  }

  async export(): Promise<SerializedMemory> {
    const documents = this.vectorStore.getDocuments();
    const documentEntries: [string, Document][] = documents.map((doc, index) => [
      `doc_${index}`,
      doc
    ]);

    return {
      stm: this.stm.getMessages(),
      ltm_documents: documentEntries,
    };
  }

  async load(memory: SerializedMemory) {
    this.stm.clear();
    this.stm.addMessages(memory.stm);

    // Recreate the vector store from exported documents
    const docs = memory.ltm_documents.map(([_, doc]) => doc);
    this.vectorStore = new MemoryVectorStore(this.client);
    await this.vectorStore.addDocuments(docs);
    
    this.ltm = new VectorStoreRetrieverMemory(this.vectorStore, {
      memoryKey: "ltm_context",
      k: 5
    });
    console.log("Memory loaded successfully.");
  }
}

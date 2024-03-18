import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { createStuffDocumentsChain } from "langchain/chains/combine_documents"
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { createRetrievalChain } from 'langchain/chains/retrieval'


import * as dotenv from 'dotenv';
dotenv.config();

const createVectorStore = async () => {
    const pdfLoader = new PDFLoader(
        "./docs/Anshul_Resume.pdf"
    )

    const docs = await pdfLoader.load();
    
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 20
    });

    const splitDocs = await splitter.splitDocuments(docs)
    
    const embeddings = new OpenAIEmbeddings();

    const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
    );

    return vectorStore;
}

const createChain = async (vectorStore) => {
    // create model
    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7
    })

    // create prompt template
    const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the user's question.
        Context: {context}
        Question: {input}
   `);

    // create a chain 
    const chain = await createStuffDocumentsChain({
        llm: model,
        prompt: prompt
    })
    
    // retrieve the data
    const retriever = vectorStore.asRetriever({
        k: 3
    });
    
    const retrievalChain = await createRetrievalChain({
        combineDocsChain: chain,
        retriever: retriever

    })
    return retrievalChain;
}

export async function getResponse(question,conversationContext) {
    const vectorStore = await createVectorStore()
    const chain = await createChain(vectorStore)

    const response = await chain.invoke({
        input: question,
        context:conversationContext
    })
    return { response: response.answer, newContext: response.context };
}




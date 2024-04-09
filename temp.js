import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from 'langchain/memory'
import { UpstashRedisChatMessageHistory } from '@langchain/community/stores/message/upstash_redis'
import { ConversationChain } from 'langchain/chains'


import * as dotenv from 'dotenv';

dotenv.config();

const memory = new BufferMemory({
    chatHistory: new UpstashRedisChatMessageHistory({
        sessionId:'123',
        config: {
          url:'https://us1-closing-pup-41371.upstash.io',
          token:'AaGbASQgODY5NzhlZGItN2U1ZC00YmQ4LWFmNmItZjMwYjYzMGY4MjdmNjNhZjhjYzQyZTRlNGNlMGEwMWI2N2NiOThiMjRjYzM='
        },
        sessionTTL:'',
    })
})

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7
})

const chain = new ConversationChain({
    llm:model,
    memory
})

const response = await chain.call({
    input: "tell me my name?"
})
console.log(response)
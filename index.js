import express from 'express';
import { getResponse, createChain, createVectorStore }  from './llm.js'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid';


const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}))

const PORT = process.env.PORT || 3000; 

// conversation with chat_id
const conversationContexts = new Map();

let chain;

// start conversation
app.post('/api/start-conversation', async (req, res) => {
    try {
        const conversationId = uuidv4(); 
        conversationContexts.set(conversationId, {}); 
        const vectorStore = await createVectorStore()
        if(vectorStore) {
            chain = await createChain(vectorStore);
            res.json({ conversationId }); 
            console.log({ conversationId })
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Endpoint for continuing the conversation
app.post('/api/chat/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params; 
        const { question } = req.body; 
        
        if (!question) {
            throw new Error('Question is missing in the request body');
        }
        
        const conversationContext = conversationContexts.get(conversationId);
        if (!conversationContext) {
            throw new Error('Conversation ID is invalid');
        }
        
        const response = await getResponse(chain, question); 
        console.log({ conversationId, response })
        res.json({ conversationId, response }); 
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

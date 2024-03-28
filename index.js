import express from 'express';
import { getResponse, createChain, createVectorStore }  from './llm.js'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid';
import multer  from 'multer'
import { FilePaths } from './fileHandle.js';
import { Chain } from './chains.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}))

const PORT = process.env.PORT || 3000; 

const conversationContexts = new Map();
const newFile = new FilePaths();
const newChain = new Chain();


// upload a pdf
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    const conversationId = uuidv4();
    conversationContexts.set(conversationId, {}); 
    try {
        const file = req.file; 
        if (!file) {
            throw new Error('No file uploaded');
        }
        const filePath = file.path;
        newFile.setFilePath(filePath)
        res.json({ filename: file.originalname, path: file.path, conversationId:conversationId});
        console.log("File Uploaded Successfully")
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// start conversation
app.post('/api/create-vector-store/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversationContext = conversationContexts.get(conversationId);

        if (!conversationContext) {
            throw new Error('Conversation ID is invalid');
        }
        
        const filePath = newFile.getFilePath()
        const vectorStore = await createVectorStore(conversationId,filePath)

        if(vectorStore) {
            const chain = await createChain(vectorStore);
            newChain.setChain(chain);
            res.json({ conversationId, status:"vector store created successfully" }); 
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
        const chain = newChain.getChain();
        const response = await getResponse(chain, question); 
        console.log({ conversationId, response })
        res.send({ conversationId, response }); 
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

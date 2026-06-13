const { pinecone } = require("../utils/apikey");


// store in Pinecone if Ai condition 
const storeMemory = async (userspace, userId, Id, vector, memoryText) => {
    try {

        const pcIndex = await pinecone.Index(process.env.PINECONE_INDEX_NAME);

        await pcIndex.namespace(userspace).upsert({
            records: [
                {
                    id: Id, // unique ID for the memory like mongoDB ObjectId
                    values: vector,
                    metadata: {
                        userId: userId,
                        text: memoryText,
                        timestamp: new Date().toISOString()
                    }
                }
            ]
        });
    } catch (error) {
        console.error("Error storing memory in Pinecone:", error);
        throw error;
    }
};

// Search for relevant memories in Pinecone
const searchMemories = async (userspace, userId, vector) => {
    try {

        const pcIndex = await pinecone.Index(process.env.PINECONE_INDEX_NAME);

        const response = await pcIndex.namespace(userspace).query({
            vector: vector,
            topK: 5, // number of relevant results to retrieve
            includeMetadata: true,
            filter: {
                userId: { "$eq": userId }
            }
        });
        return response;

    } catch (error) {
        console.error("Error searching memories in Pinecone:", error);
        throw error;
    }
};

module.exports = {
    storeMemory,
    searchMemories
}
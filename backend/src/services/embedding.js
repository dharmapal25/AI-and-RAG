const { gemini } = require("../utils/apikey");


async function getEmbedding(text) {

    console.log(typeof text)

    const response = await gemini.models.embedContent({
        model: "gemini-embedding-001",
        contents: String(text),
        config: {
            outputDimensionality: 768 // specify the dimensionality of the embedding vector
        }
    });

    return response.embeddings[0].values;

}

module.exports = {
    getEmbedding
}
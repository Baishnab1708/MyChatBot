from sentence_transformers import SentenceTransformer

# Load MiniLM-L6 globally
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Convert list of texts into embeddings."""
    return model.encode(texts).tolist()

from sentence_transformers import SentenceTransformer

# Make the model a global variable, but set it to None initially
model = None

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Convert list of texts into embeddings."""
    global model  # This line is crucial to modify the global model variable
    if model is None:
        # Load the model only when it's needed for the first time
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(texts).tolist()
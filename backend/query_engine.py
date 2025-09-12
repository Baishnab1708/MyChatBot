import chromadb
from embeddings import embed_texts
from intents import classify_intent

CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "profile_docs"

client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_collection(COLLECTION_NAME)


def query_answer(user_query: str, top_k: int = 2) -> str:
    # 1. Try intent classification
    intent = classify_intent(user_query)
    if intent:
        try:
            results = collection.get(ids=[intent])
            if results and results["documents"]:
                return results["documents"][0]
        except:
            pass

    # 2. Fallback to semantic search
    embedding = embed_texts([user_query])[0]
    results = collection.query(query_embeddings=[embedding], n_results=top_k)

    if results and results["documents"]:
        # If multiple docs are close, join them
        answers = [doc[0] for doc in results["documents"]]
        return "\n\n".join(answers)

    return "❌ Sorry, I don’t have an answer for that."

import os
import chromadb
from embeddings import embed_texts

DATA_DIR = "data"
CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "profile_docs"

def load_files():
    docs, ids = [], []
    for fname in sorted(os.listdir(DATA_DIR)):
        if fname.endswith(".txt"):
            with open(os.path.join(DATA_DIR, fname), "r", encoding="utf-8") as f:
                docs.append(f.read().strip())
                ids.append(fname.replace(".txt", ""))  # Use intent name as ID
    return docs, ids

if __name__ == "__main__":
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_or_create_collection(COLLECTION_NAME)

    docs, ids = load_files()
    if not docs:
        print("⚠️ No text files found in data/")
        exit()

    embeddings = embed_texts(docs)
    collection.add(documents=docs, embeddings=embeddings, ids=ids)
    print(f"✅ Database populated with {len(docs)} documents")

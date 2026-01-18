# LangChain RAG Structure

This directory is reserved for future LangChain RAG (Retrieval-Augmented Generation) implementation.

## Planned Structure

- `embeddings.ts` - Embedding generation (OpenAI text-embedding-3-small)
- `retrievers.ts` - Hybrid retriever (Vector + Keyword search)
- `chains.ts` - RetrievalQAChain setup
- `document-processors.ts` - PDF/Text parsing and chunking

## Future Implementation Notes

- Use pgvector for vector storage in PostgreSQL
- Implement Rank Reciprocal Fusion (RRF) for hybrid search
- Integrate with LangSmith for observability

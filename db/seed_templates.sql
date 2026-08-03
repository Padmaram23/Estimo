

-- ==========================
-- Image Processing + AI Search Template
-- ==========================

BEGIN;

INSERT INTO templates (name, description, icon, category) VALUES
  ('Image Processing + AI Search',
   'Image understanding pipeline: LiteLLM Gateway → Vision Model (GPT) → Sentence Transformers → Milvus → Hybrid Search → Cross Encoder → LangChain → GPT → LangSmith Observability',
   'image', 'RAG')
ON CONFLICT DO NOTHING;

-- 1. LLM Gateway — LiteLLM
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 1
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LiteLLM' AND p.is_popular = TRUE LIMIT 1;

-- 2. Vision Model — GPT-4.1 (token-based)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 5, 1, p.price_input_per_1m, p.price_output_per_1m, 2
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI (GPT-4.1, o3, o4)' AND p.name = 'GPT-4.1' LIMIT 1;

-- 3. Embeddings — Sentence Transformers (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 3
FROM tools t WHERE t.name = 'Sentence Transformers';

-- 4. Vector Database — Milvus (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 4
FROM tools t WHERE t.name = 'Milvus';

-- 5. Hybrid Search (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 5
FROM tools t WHERE t.name = 'Hybrid Search';

-- 6. Reranker — Cross Encoder (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 6
FROM tools t WHERE t.name = 'Cross Encoder';

-- 7. Orchestration — LangChain
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 7
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LangChain' AND p.is_popular = TRUE LIMIT 1;

-- 8. LLM — GPT-4.1 Mini (token-based)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 3, 1, p.price_input_per_1m, p.price_output_per_1m, 8
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI (GPT-4.1, o3, o4)' AND p.name = 'GPT-4.1 Mini' LIMIT 1;

-- 9. Observability — LangSmith
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Image Processing + AI Search'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 9
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LangSmith' AND p.is_popular = TRUE LIMIT 1;

COMMIT;

-- ==========================
-- Image Processing + AI Search Template Edges
-- ==========================

BEGIN;

INSERT INTO template_edges (template_id, source_tool, target_tool, label, color, animated) VALUES
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'LiteLLM',                  'OpenAI (GPT-4.1, o3, o4)', 'Route',            '#f59e0b', TRUE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'OpenAI (GPT-4.1, o3, o4)', 'Sentence Transformers',    'Image Embeddings', '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'Sentence Transformers',    'Milvus',                   'Store Vectors',    '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'Milvus',                   'Hybrid Search',            'ANN Results',      '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'Hybrid Search',            'Cross Encoder',            'Top-K Candidates', '#22c55e', TRUE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'Cross Encoder',            'LangChain',                'Reranked Results', '#22c55e', TRUE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'LangChain',                'OpenAI (GPT-4.1, o3, o4)', 'Prompt',           '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'LangChain',                'LangSmith',                'Trace',            '#71717a', FALSE),
  ((SELECT id FROM templates WHERE name = 'Image Processing + AI Search'), 'OpenAI (GPT-4.1, o3, o4)', 'LiteLLM',                  'Response',         '#6366f1', FALSE);

COMMIT;

-- ==========================
-- Document Assistant New Template
-- ==========================

BEGIN;

INSERT INTO templates (name, description, icon, category) VALUES
  ('Document Assistant New',
   'Document Q&A pipeline: LiteLLM → Docling → Semantic Chunking → OpenAI Embeddings → Qdrant → Hybrid Search → Cohere Rerank → LlamaIndex → LangGraph → GPT-4.1 → LangSmith',
   'file-search', 'RAG')
ON CONFLICT DO NOTHING;

-- 1. LLM Gateway — LiteLLM
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 1
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LiteLLM' AND p.is_popular = TRUE LIMIT 1;

-- 2. Document Parser — Docling (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 2
FROM tools t WHERE t.name = 'Docling';

-- 3. Semantic Chunking (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 3
FROM tools t WHERE t.name = 'Semantic Chunking';

-- 4. Embeddings — OpenAI text-embedding-3-large
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 10, 0, p.price_input_per_1m, p.price_output_per_1m, 4
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI Embeddings' AND p.name = 'text-embedding-3-large' LIMIT 1;

-- 5. Vector Database — Qdrant Cloud
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 5
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'Qdrant Cloud' AND p.is_popular = TRUE LIMIT 1;

-- 6. Hybrid Search (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 6
FROM tools t WHERE t.name = 'Hybrid Search';

-- 7. Reranker — Cohere Rerank
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 1, 0, p.price_input_per_1m, p.price_output_per_1m, 7
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'Cohere Rerank' AND p.is_popular = TRUE LIMIT 1;

-- 8. Orchestration — LlamaIndex
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 8
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LlamaIndex' AND p.is_popular = TRUE LIMIT 1;

-- 9. Agent Framework — LangGraph
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 9
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LangGraph' AND p.is_popular = TRUE LIMIT 1;

-- 10. LLM — GPT-4.1 Mini
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 3, 1, p.price_input_per_1m, p.price_output_per_1m, 10
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI (GPT-4.1, o3, o4)' AND p.name = 'GPT-4.1 Mini' LIMIT 1;

-- 11. Observability — LangSmith
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Document Assistant New'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 11
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LangSmith' AND p.is_popular = TRUE LIMIT 1;

COMMIT;

-- ==========================
-- Document Assistant New Template Edges
-- ==========================

BEGIN;

INSERT INTO template_edges (template_id, source_tool, target_tool, label, color, animated) VALUES
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'LiteLLM',                  'Docling',                  'Route & Parse',    '#f59e0b', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'Docling',                  'Semantic Chunking',        'Raw Text',         '#f59e0b', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'Semantic Chunking',        'OpenAI Embeddings',        'Chunks',           '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'OpenAI Embeddings',        'Qdrant Cloud',             'Store Vectors',    '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'Qdrant Cloud',             'Hybrid Search',            'ANN Results',      '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'Hybrid Search',            'Cohere Rerank',            'Top-K Candidates', '#22c55e', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'Cohere Rerank',            'LlamaIndex',               'Reranked Chunks',  '#22c55e', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'LlamaIndex',               'LangGraph',                'Context + Query',  '#38bdf8', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'LangGraph',                'OpenAI (GPT-4.1, o3, o4)', 'Prompt',           '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'LangGraph',                'LangSmith',                'Trace',            '#71717a', FALSE),
  ((SELECT id FROM templates WHERE name = 'Document Assistant New'), 'OpenAI (GPT-4.1, o3, o4)', 'LiteLLM',                  'Response',         '#6366f1', FALSE);

COMMIT;

-- ==========================
-- Resume Screening System Template
-- ==========================

BEGIN;

INSERT INTO templates (name, description, icon, category) VALUES
  ('Resume Screening System',
   'Resume screening pipeline: Docling → Semantic Chunking → OpenAI Embeddings → pgvector → Dense Retrieval → DSPy → GPT → Structured Candidate Report',
   'file-user', 'RAG')
ON CONFLICT DO NOTHING;

-- 1. Document Parser — Docling (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 1
FROM tools t WHERE t.name = 'Docling';

-- 2. Semantic Chunking (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 2
FROM tools t WHERE t.name = 'Semantic Chunking';

-- 3. OpenAI Embeddings — text-embedding-3-large
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 5, 0, p.price_input_per_1m, p.price_output_per_1m, 3
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI Embeddings' AND p.name = 'text-embedding-3-large' LIMIT 1;

-- 4. Vector Database — pgvector (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 4
FROM tools t WHERE t.name = 'pgvector';

-- 5. Dense Retrieval (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 5
FROM tools t WHERE t.name = 'Dense Retrieval';

-- 6. Orchestration — DSPy (open source)
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  NULL, NULL, 0, 6
FROM tools t WHERE t.name = 'DSPy';

-- 7. LLM — GPT-4.1 Mini
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, is_token_based, input_tokens_m, output_tokens_m, price_input_per_1m, price_output_per_1m, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, 0, TRUE, 3, 1, p.price_input_per_1m, p.price_output_per_1m, 7
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'OpenAI (GPT-4.1, o3, o4)' AND p.name = 'GPT-4.1 Mini' LIMIT 1;

-- 8. Observability — LangSmith
INSERT INTO template_selections (template_id, tool_id, tool_name, category_name, plan_id, plan_name, price, sort_order)
SELECT (SELECT id FROM templates WHERE name = 'Resume Screening System'),
  t.id, t.name, (SELECT name FROM category WHERE id = t.category_id),
  p.id, p.name, p.price, 8
FROM tools t JOIN plans p ON p.tool_id = t.id
WHERE t.name = 'LangSmith' AND p.is_popular = TRUE LIMIT 1;

COMMIT;

-- ==========================
-- Resume Screening System Template Edges
-- ==========================

BEGIN;

INSERT INTO template_edges (template_id, source_tool, target_tool, label, color, animated) VALUES
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'Docling',                  'Semantic Chunking',        'Raw Text',         '#f59e0b', TRUE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'Semantic Chunking',        'OpenAI Embeddings',        'Chunks',           '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'OpenAI Embeddings',        'pgvector',                 'Store Vectors',    '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'pgvector',                 'Dense Retrieval',          'ANN Results',      '#6366f1', FALSE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'Dense Retrieval',          'DSPy',                     'Candidates',       '#22c55e', TRUE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'DSPy',                     'OpenAI (GPT-4.1, o3, o4)', 'Prompt',           '#6366f1', TRUE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'DSPy',                     'LangSmith',                'Trace',            '#71717a', FALSE),
  ((SELECT id FROM templates WHERE name = 'Resume Screening System'), 'OpenAI (GPT-4.1, o3, o4)', 'LangSmith',                'Observe',          '#71717a', FALSE);

COMMIT;

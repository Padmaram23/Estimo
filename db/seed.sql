BEGIN;

-- ==========================
-- Categories
-- ==========================

INSERT INTO category (name) VALUES
('Foundation Models'),
('Inference Engines'),
('LLM Gateways'),
('AI Agent Frameworks'),
('AI Orchestration Frameworks'),
('Prompt Engineering'),
('Embedding Models'),
('Vector Databases'),
('Knowledge Graphs'),
('RAG Components'),
('Databases'),
('AI Observability');

-- ==========================
-- Foundation Models
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('OpenAI (GPT-4.1, o3, o4)'),
('Claude'),
('Gemini'),
('Cohere'),
('Mistral API'),
('Llama'),
('DeepSeek'),
('Qwen'),
('Phi'),
('Gemma'),
('Mistral'),
('Falcon')
) AS t(tool)
WHERE c.name = 'Foundation Models';

-- ==========================
-- Inference Engines
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('Ollama'),
('vLLM'),
('LM Studio'),
('llama.cpp'),
('TensorRT-LLM'),
('NVIDIA NIM')
) AS t(tool)
WHERE c.name = 'Inference Engines';

-- ==========================
-- LLM Gateways
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LiteLLM'),
('Portkey'),
('OpenRouter'),
('Kong AI Gateway'),
('Azure AI Foundry Gateway'),
('Helicone'),
('LangDB'),
('Gateway API (Custom)'),
('Envoy AI Gateway')
) AS t(tool)
WHERE c.name = 'LLM Gateways';

-- ==========================
-- AI Agent Frameworks
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LangGraph'),
('CrewAI'),
('AutoGen'),
('OpenAI Agents SDK'),
('Agno'),
('PydanticAI'),
('Semantic Kernel'),
('Camel AI'),
('SmolAgents'),
('Mastra')
) AS t(tool)
WHERE c.name = 'AI Agent Frameworks';

-- ==========================
-- AI Orchestration Frameworks
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LangChain'),
('LlamaIndex'),
('Haystack'),
('DSPy'),
('Semantic Kernel'),
('Flowise'),
('LangFlow'),
('OpenPipe')
) AS t(tool)
WHERE c.name = 'AI Orchestration Frameworks';

-- ==========================
-- Prompt Engineering
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LangSmith'),
('PromptLayer'),
('Helicone'),
('Promptfoo'),
('Ragas'),
('DeepEval'),
('TruLens'),
('OpenAI Evals'),
('Giskard'),
('Braintrust')
) AS t(tool)
WHERE c.name = 'Prompt Engineering';

-- ==========================
-- Embedding Models
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('OpenAI Embeddings'),
('Voyage AI'),
('Cohere Embed'),
('BAAI BGE'),
('Jina AI'),
('Sentence Transformers'),
('Nomic Embed'),
('E5 Models')
) AS t(tool)
WHERE c.name = 'Embedding Models';

-- ==========================
-- Vector Databases
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('Pinecone'),
('Weaviate'),
('Qdrant Cloud'),
('Milvus'),
('Qdrant'),
('Chroma'),
('pgvector'),
('Redis Vector'),
('Elasticsearch'),
('OpenSearch')
) AS t(tool)
WHERE c.name = 'Vector Databases';

-- ==========================
-- Knowledge Graphs
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('Neo4j'),
('Memgraph'),
('ArangoDB'),
('Amazon Neptune'),
('GraphDB')
) AS t(tool)
WHERE c.name = 'Knowledge Graphs';

-- ==========================
-- RAG Components
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LlamaParse'),
('Docling'),
('Unstructured'),
('Apache Tika'),
('Marker'),
('LangChain'),
('LlamaIndex'),
('Semantic Chunking'),
('Recursive Chunking'),
('Hybrid Search'),
('BM25'),
('Dense Retrieval'),
('Sparse Retrieval'),
('Parent Document Retrieval'),
('Cohere Rerank'),
('BGE Reranker'),
('Jina Reranker'),
('Cross Encoder')
) AS t(tool)
WHERE c.name = 'RAG Components';

-- ==========================
-- Databases
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('PostgreSQL'),
('MySQL'),
('SQL Server'),
('MongoDB'),
('DynamoDB'),
('Cassandra'),
('Redis'),
('Memcached'),
('Snowflake'),
('BigQuery'),
('Redshift'),
('ClickHouse')
) AS t(tool)
WHERE c.name = 'Databases';

-- ==========================
-- AI Observability
-- ==========================

INSERT INTO tools (name, category_id)
SELECT tool, c.id
FROM category c,
(VALUES
('LangSmith'),
('Langfuse'),
('Helicone'),
('AgentOps'),
('Arize Phoenix'),
('WhyLabs'),
('Evidently AI'),
('OpenTelemetry')
) AS t(tool)
WHERE c.name = 'AI Observability';

COMMIT;

BEGIN;

-- ==========================
-- OpenAI
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'GPT-4.1',        'Latest GPT-4.1 flagship model',          0, 'monthly', TRUE,  2.00,  8.00,  FALSE FROM tools WHERE name = 'OpenAI (GPT-4.1, o3, o4)';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'GPT-4.1 Mini',   'Lightweight and fast GPT-4.1 variant',   0, 'monthly', TRUE,  0.40,  1.60,  TRUE  FROM tools WHERE name = 'OpenAI (GPT-4.1, o3, o4)';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'GPT-4.1 Nano',   'Cheapest and fastest GPT-4.1 variant',   0, 'monthly', TRUE,  0.10,  0.40   FROM tools WHERE name = 'OpenAI (GPT-4.1, o3, o4)';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'o3',             'Advanced reasoning model',                0, 'monthly', TRUE, 2.00, 8.00   FROM tools WHERE name = 'OpenAI (GPT-4.1, o3, o4)';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'o4-mini',        'Fast reasoning at lower cost',            0, 'monthly', TRUE,  1.10,  4.40   FROM tools WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

-- ==========================
-- Claude
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Claude Opus 4',   'Most powerful Claude model',             0, 'monthly', TRUE, 15.00, 75.00,  FALSE FROM tools WHERE name = 'Claude';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Claude Sonnet 4', 'Best balance of speed and intelligence', 0, 'monthly', TRUE,  3.00, 15.00,  TRUE  FROM tools WHERE name = 'Claude';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Claude Haiku 3.5','Fastest and most compact Claude',        0, 'monthly', TRUE,  0.80,  4.00   FROM tools WHERE name = 'Claude';

-- ==========================
-- Gemini
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Gemini 2.5 Pro',   'Most capable Gemini model',            0, 'monthly', TRUE,  1.25,  10.00, TRUE  FROM tools WHERE name = 'Gemini';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Gemini 2.5 Flash', 'Fast and efficient Gemini model',      0, 'monthly', TRUE,  0.30,  2.50   FROM tools WHERE name = 'Gemini';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Gemini 2.0 Flash', 'Previous generation flash model',      0, 'monthly', TRUE,  0.15,   0.60   FROM tools WHERE name = 'Gemini';

-- ==========================
-- Cohere
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Command R+',  'Cohere flagship for enterprise RAG',         0, 'monthly', TRUE,  2.50,  10.00, TRUE  FROM tools WHERE name = 'Cohere';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Command R',   'Balanced model for RAG and agents',          0, 'monthly', TRUE,  0.15,   0.60  FROM tools WHERE name = 'Cohere';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Command A+',  'Our fastest, most powerful open-source model for high-performance enterprise agents with maximum efficiency.',         0, 'monthly', TRUE,  0.00,  0.00, TRUE  FROM tools WHERE name = 'Cohere';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Command R7B',  'Our smallest model, made for building powerful applications on commodity GPUs and edge devices.',         0, 'monthly', TRUE,  0.0375,  0.15, TRUE  FROM tools WHERE name = 'Cohere';


-- ==========================
-- Mistral API
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Mistral Large 3', 'Top-tier Mistral frontier model',          0, 'monthly', TRUE,  0.50,  1.50,  TRUE  FROM tools WHERE name = 'Mistral API';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Mistral Small 4', 'Efficient model for simple tasks',         0, 'monthly', TRUE,  0.15,  0.60   FROM tools WHERE name = 'Mistral API';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Mistral Medium 3.5', 'State-of-the-art performance. Simplified enterprise deployments. Cost-efficient.',          0, 'monthly', TRUE,  1.50,  7.50,  TRUE  FROM tools WHERE name = 'Mistral API';

-- ==========================
-- Grok
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Grok 3',        'xAI flagship reasoning model',             0, 'monthly', TRUE,  3.00, 15.00,  TRUE  FROM tools WHERE name = 'Grok';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Grok 3 Mini Global',   'Fast and affordable Grok model',           0, 'monthly', TRUE,  0.25,  1.27   FROM tools WHERE name = 'Grok';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Grok 4 Fast',        'xAI flagship reasoning model',             0, 'monthly', TRUE,  0.20, 0.50,  TRUE  FROM tools WHERE name = 'Grok';

-- ==========================
-- Llama
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Llama 3.3 70B Global(azure)',       'Llama 3.3 70B Global',   0, 'monthly', TRUE,  0.71,  0.71, FALSE FROM tools WHERE name = 'Llama';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Llama 3.3 70B (Groq)',       'Via Groq inference',          0, 'monthly', TRUE,  0.59,  0.79, TRUE  FROM tools WHERE name = 'Llama';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Llama 3.3 70B (Together)',   'Via Together AI',             0, 'monthly', TRUE,  0.88,  0.88  FROM tools WHERE name = 'Llama';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Llama 3.1 405B (Together)',  'Via Together AI',             0, 'monthly', TRUE,  3.50,  3.50  FROM tools WHERE name = 'Llama';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Llama 3.1 8B (Groq)',        'Ultra-fast 8B via Groq',      0, 'monthly', TRUE,  0.05,  0.08  FROM tools WHERE name = 'Llama';

-- ==========================
-- DeepSeek
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'DeepSeek V3',      'Flagship DeepSeek model',               0, 'monthly', TRUE,  0.27,  1.10, TRUE  FROM tools WHERE name = 'DeepSeek';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'DeepSeek R1',      'Reasoning-focused DeepSeek model',      0, 'monthly', TRUE,  0.55,  2.19  FROM tools WHERE name = 'DeepSeek';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'DeepSeek V3 Flash','Low-cost fast variant',                  0, 'monthly', TRUE,  0.07,  0.28  FROM tools WHERE name = 'DeepSeek';

-- ==========================
-- Qwen
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Qwen3.5-Flash',  'Alibaba flagship Qwen3 model',               0, 'monthly', TRUE,  0.10,  0.4, TRUE  FROM tools WHERE name = 'Qwen';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Qwen3.6-Plus',   'Mid-size Qwen3 model',                       0, 'monthly', TRUE,  0.50,  3.00  FROM tools WHERE name = 'Qwen';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Qwen3.7-Max',   'Mid-size Qwen3 model',                       0, 'monthly', TRUE,  2.50,  7.50  FROM tools WHERE name = 'Qwen';

-- ==========================
-- Phi
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Phi-4',       'Microsoft Phi-4 14B model',                  0, 'monthly', TRUE,  0.125,  0.5, TRUE  FROM tools WHERE name = 'Phi';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Phi-4 Mini',  'Compact Phi-4 3.8B model',                   0, 'monthly', TRUE,  0.075,  0.3  FROM tools WHERE name = 'Phi';

-- ==========================
-- Gemma
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Gemma 3 27B', 'Google Gemma 3 27B via Groq',                0, 'monthly', TRUE,  0.20,  0.20, TRUE  FROM tools WHERE name = 'Gemma';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Gemma 3 12B', 'Google Gemma 3 12B via Groq',                0, 'monthly', TRUE,  0.10,  0.10  FROM tools WHERE name = 'Gemma';

-- ==========================
-- Mistral (OSS)
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Mistral 7B (Groq)',  'Mistral 7B via Groq',                 0, 'monthly', TRUE,  0.05,  0.05, TRUE  FROM tools WHERE name = 'Mistral';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Mixtral 8x7B',       'Mixture-of-experts Mixtral',          0, 'monthly', TRUE,  0.24,  0.24  FROM tools WHERE name = 'Mistral';

-- ==========================
-- Falcon
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'Falcon 180B', 'TII Falcon 180B via Together AI',            0, 'monthly', TRUE,  5.00,  5.00, TRUE  FROM tools WHERE name = 'Falcon';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'Falcon 40B',  'TII Falcon 40B via Together AI',             0, 'monthly', TRUE,  1.00,  1.00  FROM tools WHERE name = 'Falcon';

-- ==========================
-- Embedding Models (also token-based)
-- ==========================

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'text-embedding-3-large', 'OpenAI large embedding model',    0, 'monthly', TRUE, 0.13, 0, TRUE  FROM tools WHERE name = 'OpenAI Embeddings';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'text-embedding-3-small', 'OpenAI small embedding model',    0, 'monthly', TRUE, 0.02, 0  FROM tools WHERE name = 'OpenAI Embeddings';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'voyage-4', 'Voyage AI flagship embedding',            0, 'monthly', TRUE, 0.06, 0, TRUE  FROM tools WHERE name = 'Voyage AI';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'voyage-4-large',       'Voyage AI standard embedding',            0, 'monthly', TRUE, 0.12, 0  FROM tools WHERE name = 'Voyage AI';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m)
SELECT id, 'voyage-4-lite',       'Voyage AI standard embedding',            0, 'monthly', TRUE, 0.02, 0  FROM tools WHERE name = 'Voyage AI';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'embed-v4.0', 'Cohere multilingual embeddings',              0, 'monthly', TRUE, 0.12, 0, TRUE  FROM tools WHERE name = 'Cohere Embed';
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'embed-3', 'Cohere multilingual embeddings',              0, 'monthly', TRUE, 0.10, 0, TRUE  FROM tools WHERE name = 'Cohere Embed';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'BAAI: bge-m3', 'openrouter',      0, 'monthly', TRUE, 0.01, 0, TRUE  FROM tools WHERE name = 'BAAI BGE';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'jina-embeddings-v3', 'Jina AI multilingual embedding',      0, 'monthly', TRUE, 0.05, 0, TRUE  FROM tools WHERE name = 'Jina AI';

-- ==========================
-- LangGraph
-- ==========================

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'LangGraph Plus','Hosted Platform',39
FROM tools WHERE name='LangGraph';

COMMIT;

BEGIN;

-- ============================================================
-- Portkey
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    is_popular
)
SELECT
    id,
    'Developer',
    'Perfect for prototyping and testing or evaluating enterprise POCs. Not suitable for production workloads.',
    0,
    'monthly',
    FALSE
FROM tools
WHERE name = 'Portkey';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    is_popular
)
SELECT
    id,
    'Production',
    'Great for teams ready to deploy LLM apps in production. Not recommended for organizations requiring custom security controls or data residency guarantees.',
    49.00,
    'monthly',
    TRUE
FROM tools
WHERE name = 'Portkey';

-- ============================================================
-- LangDB
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'free',
    'Best for getting started',
    0,
    'monthly',
     ARRAY[
        'Access to 250+ models',
        '1 Project',
        '2k logs / month',
        '7-day data retention',
        'Tracing and debugging',
        'Observability',
        'Google Workspace'
    ],
    FALSE
FROM tools
WHERE name = 'LangDB';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Professional',
    'Best for individual developers',
    49.00,
    'monthly',
     ARRAY[
        '2 Projects',
        '20k logs / month',
        'Bring your own LLM keys',
        'Project level Cost Control',
        'Basic Guardrails',
        '30-day data retention',
        'User Management',
        '10 Virtual Models'
    ],
    TRUE
FROM tools
WHERE name = 'LangDB';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Business',
    'Best for individual developers',
    199.00,
    'monthly',
     ARRAY[
        'Unlimited Projects',
        '200k logs / month',
        '90-day data retention',
        'LLM + Partner Guardrails',
        'Unlimited virtual models',
        'Role based access',
        'SSO + SAML',
        'Dynamic Cost Control'
    ],
    FALSE
FROM tools
WHERE name = 'LangDB';

-- ============================================================
-- LangChain
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Developer',
    'For solo users getting started.',
    0,
    'monthly',
    ARRAY[
        '1 seat',
        'Community support',
        'Up to 5k base traces / mo, then pay-as-you-go'
    ],
    FALSE
FROM tools
WHERE name = 'LangChain';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Plus',
    'For teams building and deploying agents.',
    39.00,
    'monthly',
    ARRAY[
        'Per seat pricing',
        'Pay as you go',
        'Up to 10k base traces/month',
        'Deployment',
        'Sandboxes',
        'Engine',
        'Unlimited seats',
        'Email support'
    ],
    TRUE
FROM tools
WHERE name = 'LangChain';


-- ============================================================
-- CrewAI
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'basic',
    'Build an agentic workflow today, and see whats possible with collaborative AI agents.',
    0,
    'monthly',
    ARRAY[
        'Visual editor and AI copilot',
        'GitHub integration',
        '50 workflow executions/month'
    ],
    FALSE
FROM tools
WHERE name = 'CrewAI';


-- ============================================================
-- Agno
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Free',
    'For building agent systems',
    0,
    'monthly',
    ARRAY[
        'Open Source',
        'Control Plane for local AgentOS',
        'Jumpstart & community'
    ],
    FALSE
FROM tools
WHERE name = 'Agno';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'For managing production systems',
    150.00,
    'monthly',
    ARRAY[
        'Everything in Free',
        'Control Plane for live AgentOS',
        'Unlimited usage'
    ],
    TRUE
FROM tools
WHERE name = 'Agno';


-- ============================================================
-- PydanticAI
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Personal',
    'For your personal account — use it for proof of concept and personal projects.',
    0,
    'monthly',
     ARRAY[
        '1 seat',
        '2 guests (read-only)',
        '3 projects',
        '10M logs/spans/metrics incl.',
        '30-day data retention',
        'EU or US region',
        'Pydantic AI Gateway'
    ],
    FALSE
FROM tools
WHERE name = 'PydanticAI';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Team',
    'For startups and small teams shipping to prod. Fair rates for records. Price cap if needed.',
    49.00,
    'monthly',
     ARRAY[
        'Everything from Personal',
        'Money-back guarantee',
        'Up to 12 seats (5 included)',
        '10 guests (read-only)',
        '5 projects',
        '$2/M additional records',
        'Price cap',
        'Pydantic AI Gateway'
    ],
    TRUE
FROM tools
WHERE name = 'PydanticAI';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Growth',
    'For scaling teams wanting the full power of Logfire. Priority support plus no seat or project caps.',
    259.00,
    'monthly',
     ARRAY[
        'Everything from Team',
        'Unlimited seats',
        'Unlimited guests',
        'Unlimited projects',
        'Priority support',
        'Extended data retention',
        'Data deletion (GDPR)',
        'Boilerplate BAA (HIPAA)',
        'Pydantic AI Gateway'
    ],
    FALSE
FROM tools
WHERE name = 'PydanticAI';

-- ============================================================
-- Camel AI
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'free',
    '',
    0,
    'monthly',
     ARRAY[
        'Bring your own API key',
        '1 workspace',
        '3 deployed apps',
        '5 GB storage',
        '2 cron jobs (daily)'
    ],
    FALSE
FROM tools
WHERE name = 'Camel AI';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Starter',
    '',
    10.00,
    'monthly',
     ARRAY[
        '$10 of model credits / mo',
        'Bring your own API key',
        '30 deployed apps',
        '50 GB storage',
        '10 cron jobs (hourly)',
        '10 custom domains',
        'Email inbox'
    ],
    FALSE
FROM tools
WHERE name = 'Camel AI';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'pro',
    '',
    40.00,
    'monthly',
     ARRAY[
        '$40 of model credits / mo',
        'Bring your own API key',
        'Unlimited apps',
        '100 GB storage',
        '50 cron jobs (5-min)',
        'Unlimited domains'
    ],
    FALSE
FROM tools
WHERE name = 'Camel AI';


-- ============================================================
-- SmolAgents
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Starter',
    'Starter Plan',
    0.00,
    'monthly',
    ARRAY[
        '5 Devices',
        '1 month cloud retention',
        'Unlimited notifications',
        'Basic integrations',
        'Always free'
    ]
FROM tools
WHERE name = 'SmolAgents';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'Professional Plan',
    12.00,
    'monthly',
    ARRAY[
        'Unlimited Devices',
        '1 year cloud retention',
        'Unlimited notifications',
        'Advanced integrations',
        'Priority Customer Support'
    ],
    TRUE
FROM tools
WHERE name = 'SmolAgents';


-- ============================================================
-- Mastra
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Starter',
    'Free for everyone',
    0,
    'monthly',
     ARRAY[
        '100K events  + $10/100K',
        '24 CPU hours  + $0.35/hr',
        '15 days',
        'Unlimited users, deployments, and projects'
    ],
    FALSE
FROM tools
WHERE name = 'Mastra';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Teams',
    'For growing teams',
    250.00,
    'monthly',
     ARRAY[
        '1M events  + $8/100K'
        '250 CPU hours  + $0.25/hr'
        '6 months'
        'Multiple teams, SSO, and SOC 2 docs'
    ],
    FALSE
FROM tools
WHERE name = 'Mastra';


-- ============================================================
-- LlamaIndex
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Free',
    'Free Plan',
    0.00,
    'monthly',
    ARRAY[
      'Includes 10K credits',
      'Upgrade to starter for Pay-as-you-go credits',
      '100 users',
      'Basic support'
    ]
FROM tools
WHERE name = 'LlamaIndex';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Starter',
    'Starter Plan',
    50.00,
    'monthly',
    ARRAY[
        '40K credits',
        'Pay-as-you-go up to 400K credits',
        '5 users',
        'Basic support'
    ]
FROM tools
WHERE name = 'LlamaIndex';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'Professional Plan',
    500.00,
    'monthly',
    ARRAY[
        '400K credits',
        'Pay-as-you-go up to 4,000K credits',
        '10 users',
        'Slack support'
    ],
    TRUE
FROM tools
WHERE name = 'LlamaIndex';

-- ============================================================
-- Flowise
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Free',
    'Free Plan',
    0.00,
    'monthly',
    ARRAY[
      '2 Flows & Assistants',
      '100 Predictions / month',
      '5MB Storage',
      'Evaluations & Metrics',
      'Custom Embedded Chatbot Branding',
      'Community Support'
    ]
FROM tools
WHERE name = 'Flowise';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Starter',
    'For individuals & small teams',
    35.00,
    'monthly',
    ARRAY[
        'Everything in Free',
        'Unlimited Flows & Assistants',
        '10,000 Predictions / month',
        '1GB Storage',
        'Community Support'
    ]
FROM tools
WHERE name = 'Flowise';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'For medium-sized businesses',
    65.00,
    'monthly',
    ARRAY[
        'Everything in Starter',
        '50,000 Predictions / month',
        '10GB Storage',
        'Unlimited Workspaces',
        '5 Users+ $15/user/month',
        'Admin Roles & Permissions',
        'Priority Support'
    ],
    TRUE
FROM tools
WHERE name = 'Flowise';




-- ============================================================
-- PromptLayer
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'free',
    'for hackers',
    0.00,
    'monthly',
    ARRAY[
        '5 Users',
        '2.5k/month Requests',
        '1 Workspace',
        '250/month Eval Cell Executions',
        '10MB max per Dataset'
    ]
FROM tools
WHERE name = 'PromptLayer';


INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Pro',
    'For small teams',
    49.00,
    'monthly',
    ARRAY[
        'Unlimited Playgrounds',
        'Unlimited Workspaces',
        '150MB max per Dataset',
        'Pay-as-you-go ($0.003 per transaction)'
    ]
FROM tools
WHERE name = 'PromptLayer';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Team',
    'For growing teams',
    500.00,
    'monthly',
    ARRAY[
        '25 Users',
        '100k+ Requests/month',
        '7.5k+ Eval Cell Executions/month',
        '1GB max per Dataset',
        'Pay-as-you-go ($0.002 per transaction)'
    ],
    TRUE
FROM tools
WHERE name = 'PromptLayer';


-- ============================================================
-- Helicone
-- ============================================================
INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Free',
    'Kickstart your AI project.',
    0,
    'monthly',
    ARRAY[
        'Everything in Hobby',
        '10,000 free requests',
        '1 GB storage',
        '1 seat, 1 organization'
    ],
    TRUE
FROM tools
WHERE name = 'Helicone';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'For growing teams.',
    79.00,
    'monthly',
    ARRAY[
        'Everything in Hobby',
        'Unlimited seats',
        'Alerts & reports',
        'HQL (Query Language)'
    ],
    TRUE
FROM tools
WHERE name = 'Helicone';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Team',
    'For scaling companies.',
    799.00,
    'monthly',
    ARRAY[
        'Everything in Pro',
        '5 organizations',
        'SOC-2 & HIPAA compliance',
        'Dedicated Slack channel'
    ]
FROM tools
WHERE name = 'Helicone';


-- ============================================================
-- DeepEval
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'free',
    'Explore Confident AI at no cost.',
    0.00,
    'monthly',
    ARRAY[
        'Full LLM unit and regression testing suite',
        'Evals in development and CI/CD',
        'LLM tracing',
        'Prompt versioning',
        'Community and documentation support',
        'Limited to 2 user seats',
        'Limited to 1 project',
        '5 test runs per week',
        'additional test runs are locked',
        '1 GB-month of trace spans',
        'additional trace spans are dropped'
    ],
    TRUE
FROM tools
WHERE name = 'DeepEval';


INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Starter',
    'Launch reliable AI into production.',
    200,
    'monthly',
    ARRAY[
        'Datasets on the cloud',
        'Custom evaluation metrics',
        'Online evals on live traffic',
        'Annotation queues & workflows',
        'Chat simulations',
        'Downstream observability workflows',
        'Real-time alerting',
        'Full Project API Access',
        'Limits',
        'Unlimited user seats',
        'Limited to 5 projects',
        '5 GB-months of trace spans',
        'then $1 per GB-month ingested or retained',
        '5k online eval metric runs/month',
        'then $1 per 1k runs'
    ],
    TRUE
FROM tools
WHERE name = 'DeepEval';


INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Team',
    'Scale AI quality across your organization.',
    2000,
    'monthly',
    ARRAY[
        'No-code AI evaluation workflows',
        'Alert integrations (e.g. Slack and PagerDuty)',
        'Metric & dataset versioning',
        'Git-based prompt workflows',
        'Custom RBAC',
        'SOC2',
        'SSO'
        'Dedicated support channel',
        'Unlimited user seats',
        'Unlimited projects',
        '75 GB-months of trace spans',
        'then $1 per GB-month ingested or retained',
        '50k online eval metric runs/month',
        'then $1 per 1k runs'
    ],
    TRUE
FROM tools
WHERE name = 'DeepEval';


-- ============================================================
-- Braintrust
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Starter',
    'For everyone',
    0.00,
    'monthly',
    ARRAY[
      '$10 credits   + tok rates',
      '1 GB processed data  + $4/GB',
      '10k scores  + $2.50/1k',
      '14-day retention'
    ],
    TRUE
FROM tools
WHERE name = 'Braintrust';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'For AI-native teams',
    249.00,
    'monthly',
    ARRAY[
        '$249 credits included',
        'Token rates apply',
        '5 GB processed data',
        '$3 per additional GB',
        '50k scores',
        '$1.50 per additional 1k scores',
        '30-day retention',
        'Custom charts',
        'Environments',
        'Priority support',
        'RBAC'
    ],
    TRUE
FROM tools
WHERE name = 'Braintrust';

-- Pinecone
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Starter', 'For trying out and for small applications.', 0, 'monthly',
  ARRAY[
    'Pinecone Database On-Demand',
    'Pinecone Inference',
    'Pinecone Assistant',
    'Dense, Sparse, and Full-Text Indexes',
    'Console Metrics',
    'Community Support via Discord',
    'Example Starter Plan workloads'
  ], 
  FALSE
FROM tools WHERE name = 'Pinecone';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Builder', 'For solo developers and small teams.', 20, 'monthly',
  ARRAY[
    'Everything in Starter',
    'Increased usage limits',
    'Choose your cloud and region',
    'Multiple projects and users',
    'Prometheus and Datadog monitoring',
    'Includes Free support',
    'Response SLAs available via'
  ], 
  FALSE
FROM tools WHERE name = 'Pinecone';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Standard', 'For production applications at any scale.', 50, 'monthly',
  ARRAY[
    'Everything in Builder',
    'Pay-as-you-go for Database On-Demand, Inference, and Assistant Usage',
    'Choose your cloud and region',
    'Dedicated Read Nodes (DRN)',
    'Import from object storage',
    'Backup and Restore',
    'User and API Key RBAC',
    'SAML SSO',
    'HIPAA add-on',
    'Includes Free support',
    'Response SLAs available via'
  ]
  , TRUE
FROM tools WHERE name = 'Pinecone';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Enterprise', 'For mission-critical production applications.', 500, 'monthly',
  ARRAY[
    'Everything in Standard',
    '99.95% Uptime SLA',
    'Bring Your Own Cloud (BYOC)',
    'Private Networking',
    'Customer Managed Encryption Keys',
    'Audit Logs',
    'Service Accounts',
    'Admin APIs',
    'HIPAA Compliance',
    'Pro support included'
  ]
  , FALSE
FROM tools WHERE name = 'Pinecone';



-- Weaviate
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Free', 'A fully managed AI Database to explore Weaviate features. Easiest way to get started, always free.', 0, 'monthly',
  ARRAY[
    '✓Always free — 1 cluster per user, upgrade to paid anytime.',
    '✓100,000 objects · 1 GB memory · 10 GB disk.',
    '✓1 collection, up to 3 tenants.',
    '✓Embeddings (2,000 req/day) + Query Agent (1,000 req/mo).',
    '✓Basic Support'
  ], 
  FALSE
FROM tools WHERE name = 'Weaviate';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Flex', 'Zero-commitment entry point to experiment and ship quickly. Ideal for prototypes, pilots, small use cases.', 45, 'monthly',
  ARRAY[
    '✓Pay-as-you-go, monthly, no commitment.',
    '✓Shared cloud cluster with full core DB toolkit + replication.',
    '✓Baseline security with RBAC.',
    '✓Highly available clusters — 99.5% uptime.',
    '✓Query Agent free tier + usage-based; Embeddings usage-based.',
    '✓Standard support — next-business-day Sev 1'
  ], 
  TRUE
FROM tools WHERE name = 'Weaviate';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Premium', 'For teams scaling AI in production who need predictable pricing and enhanced reliability.', 400, 'monthly',
  ARRAY[
    '✓Prepaid contract with predictable spend.',
    '✓Choice of shared or dedicated deployment.',
    '✓Trusted reliability — up to 99.95% uptime.',
    '✓Global coverage on AWS, GCP & Azure.',
    '✓Query Agent free tier + usage-based; Embeddings usage-based.',
    '✓Enterprise support — as fast as 1-hour Sev 1 + dedicated Technical Account Team'
  ], 
  FALSE
FROM tools WHERE name = 'Weaviate';

-- Neo4j
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'AuraDB Free', 'Learn and Explore Graphs', 0, 'monthly',
  ARRAY[
    'No credit card or other payment method required',
    'Start learning with access to all graph tools'
  ], FALSE
FROM tools WHERE name = 'Neo4j';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'AuraDB Professional', 'Build Production-Ready Apps', 65, 'monthly',
  ARRAY[
    'Up to 128GB memory per database instance',
    'Scalable on demand',
    'Daily backups, 7-day retention',
    'Available on Azure, AWS, and Google Cloud',
    'Advanced instance-level metrics'
  ], TRUE
FROM tools WHERE name = 'Neo4j';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'AuraDB Business Critical', 'Scale Apps for Enterprise Use', 65, 'monthly',
  ARRAY[
    'Up to 1944GB memory instance (GCP) & 512GB memory instance (AWS & Azure)',
    'Highly available 3-zone cluster with 99.95% uptime SLA',
    'Daily backups with 30-day retention and hourly point-in-time restore',
    'Role-based access control with granular security',
    'Pay-as-you-go and prepaid consumption billing'
  ], FALSE
FROM tools WHERE name = 'Neo4j';

-- LangSmith
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Developer', 'LangSmith free tier', 0, 'monthly',
  ARRAY['5k traces/month','7-day retention','1 workspace'], FALSE
FROM tools WHERE name = 'LangSmith';

INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Plus', 'LangSmith for teams', 39, 'monthly',
  ARRAY['Unlimited tracing','30-day retention','Team collaboration','Deployments'], TRUE
FROM tools WHERE name = 'LangSmith';

-- Cohere Rerank
INSERT INTO plans (tool_id, name, description, price, billing_cycle, is_token_based, price_input_per_1m, price_output_per_1m, is_popular)
SELECT id, 'rerank-v3.5', 'Cohere reranking API', 0, 'monthly', TRUE, 2.00, 0, TRUE
FROM tools WHERE name = 'Cohere Rerank';

-- BGE Reranker (open source, self-hosted — flat $0)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Open Source', 'Self-hosted BGE Reranker', 0, 'monthly',
  ARRAY['BAAI/bge-reranker-v2-m3','Cross-encoder scoring','No API cost'], TRUE
FROM tools WHERE name = 'BGE Reranker';

-- LlamaParse (already exists but ensure popular plan present — skip if already seeded)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Free', 'LlamaParse free tier', 0, 'monthly',
  ARRAY['7k pages/day','Basic parsing'], FALSE
FROM tools WHERE name = 'LlamaParse'
ON CONFLICT DO NOTHING;

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features
)
SELECT
    id,
    'Starter',
    'Starter Plan',
    50.00,
    'monthly',
    ARRAY[
        '40K credits',
        'Pay-as-you-go up to 400K credits',
        '5 users',
        'Basic support'
    ]
FROM tools
WHERE name = 'LlamaParse';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'Professional Plan',
    500.00,
    'monthly',
    ARRAY[
        '400K credits',
        'Pay-as-you-go up to 4,000K credits',
        '10 users',
        'Slack support'
    ],
    TRUE
FROM tools
WHERE name = 'LlamaParse';


-- Semantic Chunking (open source component)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Open Source', 'Semantic chunking (LangChain/LlamaIndex)', 0, 'monthly',
  ARRAY['Sentence-level splitting','Embedding-based boundaries','No cost'], TRUE
FROM tools WHERE name = 'Semantic Chunking';

-- Hybrid Search (open source component)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Open Source', 'Hybrid search (BM25 + dense)', 0, 'monthly',
  ARRAY['Sparse + dense fusion','RRF scoring','No cost'], TRUE
FROM tools WHERE name = 'Hybrid Search';

-- BM25 (open source)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Open Source', 'BM25 sparse retrieval', 0, 'monthly',
  ARRAY['Keyword scoring','Fast lexical search','No cost'], TRUE
FROM tools WHERE name = 'BM25';

-- Dense Retrieval (open source)
INSERT INTO plans (tool_id, name, description, price, billing_cycle, features, is_popular)
SELECT id, 'Open Source', 'Dense vector retrieval', 0, 'monthly',
  ARRAY['ANN search','Embedding-based','No cost'], TRUE
FROM tools WHERE name = 'Dense Retrieval';


-- ============================================================
-- MongoDB
-- ============================================================
INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Free',
    'For learning and exploring MongoDB in a cloud environment.',
    0,
    'monthly',
    ARRAY[
        'STORAGE  512 MB',
        'RAM  Shared',
        'vCPU  Shared'
    ],
    FALSE
FROM tools
WHERE name = 'MongoDB';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Flex',
    'For application development and testing; resources and costs scale to your needs.',
    30.00,
    'monthly',
    ARRAY[
        'STORAGE  Up to 5 GB',
        'RAM  Shared',
        'vCPU  Shared'
    ],
    FALSE
FROM tools
WHERE name = 'MongoDB';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Dedicated',
    'For production applications with sophisticated workload requirements.',
    56.94,
    'monthly',
    ARRAY[
        'STORAGE  Up to 10 GB',
        'RAM  2 GB',
        'vCPU  2cCPUs'
    ],
    TRUE
FROM tools
WHERE name = 'MongoDB';

-- ============================================================
-- Redis
-- ============================================================
INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Free',
    'Up to 30 MB',
    0,
    'monthly',
    ARRAY[
        'Shared cloud deployment',
        '30 MB single DB',
        'Best-effort SLA, community support'
    ],
    FALSE
FROM tools
WHERE name = 'Redis';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Essentials',
    'For application development and testing; resources and costs scale to your needs.',
    50.00,
    'monthly',
    ARRAY[
        'Shared deployment',
        '250 MB-100 GB RAM & SSD, single DB',
        'SAML SSO, RBAC, encryption in transit, encryption at rest',
        'Up to 99.99% uptime, basic support only',
        'Redis Flex at 10% RAM for lowest cost'
    ],
    FALSE
FROM tools
WHERE name = 'Redis';

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    features,
    is_popular
)
SELECT
    id,
    'Pro',
    'For production applications with sophisticated workload requirements.',
    200.00,
    'monthly',
    ARRAY[
        'Dedicated cloud deployment',
        'Unlimited RAM, multiple DBs',
        'Everything in Essentials, plus active-active (multi-region), auto-tiering, private connectivity',
        'Up to 99.999% uptime',
        'Flex for TBs of data, millions of ops/sec, adjustable pricing, and RAM:Flash ratio'
    ],
    TRUE
FROM tools
WHERE name = 'Redis';


-- ============================================================
-- BigQuery
-- ============================================================
INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    is_popular
)
SELECT
    id,
    'Active logical storage',
    '$0.023 / 1 GiB month, per 1 month / account (First 10 GiB free each month)',
    0.023,
    'monthly',
    FALSE
FROM tools
WHERE name = 'BigQuery'

UNION ALL

SELECT
    id,
    'Long-term logical storage',
    '$0.016 / 1 GiB month, per 1 month / account (First 10 GiB free each month)',
    0.016,
    'monthly',
    FALSE
FROM tools
WHERE name = 'BigQuery'

UNION ALL

SELECT
    id,
    'Active physical storage',
    '$0.04 / 1 GiB month, per 1 month / account (First 10 GiB free each month)',
    0.04,
    'monthly',
    FALSE
FROM tools
WHERE name = 'BigQuery'

UNION ALL

SELECT
    id,
    'Long-term physical storage',
    '$0.02 / 1 GiB month, per 1 month / account (First 10 GiB free each month)',
    0.02,
    'monthly',
    FALSE
FROM tools
WHERE name = 'BigQuery';

-- ============================================================
-- ClickHouse
-- ============================================================

INSERT INTO plans (
    tool_id,
    name,
    description,
    price,
    billing_cycle,
    is_popular
)
SELECT
    id,
    'Basic',
    'Storage: $25.30 per 1 TB/month. Compute: $0.2181 per unit/hour. Includes up to 1 TB storage, 8-12 GiB memory, daily backups (1-day retention), single availability zone, cloud export backups, expert support (1 business day), Google/Microsoft SSO, and MFA.',
    25.30,
    'monthly',
    FALSE
FROM tools
WHERE name = 'ClickHouse'

UNION ALL

SELECT
    id,
    'Scale',
    'Storage: $25.30 per 1 TB/month. Compute: $0.2985 per unit/hour. Includes unlimited storage, configurable memory, compute-storage separation, configurable backups, 2+ availability zones, private networking, automatic vertical scaling, manual horizontal scaling, S3 role-based access, and enhanced support.',
    25.30,
    'monthly',
    TRUE
FROM tools
WHERE name = 'ClickHouse'

UNION ALL

SELECT
    id,
    'Enterprise',
    'Storage: $25.30 per 1 TB/month. Compute: $0.3903 per unit/hour. Includes SAML SSO, private regions, manual vertical scaling, enterprise support, named support engineer, transparent data encryption (CMEK), scheduled upgrades, migration guidance, HIPAA and PCI compliance.',
    25.30,
    'monthly',
    FALSE
FROM tools
WHERE name = 'ClickHouse';

COMMIT;

BEGIN;
-- Cloud providers
INSERT INTO cloud_providers (name, label, logo_key) VALUES
  ('aws',   'Amazon Web Services', 'aws'),
  ('azure', 'Microsoft Azure',     'azure'),
  ('gcp',   'Google Cloud',        'gcp')
ON CONFLICT (name) DO NOTHING;

-- AWS instances
INSERT INTO cloud_instances (provider_id, instance_type, vcpu, memory_gb, price_hourly, region) VALUES
  ((SELECT id FROM cloud_providers WHERE name='aws'), 't3.small',    2,  2,    0.0208,  'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 't3.medium',   2,  4,    0.0416,  'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 't3.large',    2,  8,    0.0832,  'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'm5.large',    2,  8,    0.096,   'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'm5.xlarge',   4,  16,   0.192,   'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'c5.large',    2,  4,    0.085,   'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'c5.xlarge',   4,  8,    0.170,   'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'r5.large',    2,  16,   0.126,   'us-east-1'),
  ((SELECT id FROM cloud_providers WHERE name='aws'), 'r5.xlarge',   4,  32,   0.252,   'us-east-1');

-- Azure instances
INSERT INTO cloud_instances (provider_id, instance_type, vcpu, memory_gb, price_hourly, region) VALUES
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_B1ms',  1,  2,    0.0207,  'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_B2s',   2,  4,    0.0416,  'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_B2ms',  2,  8,    0.0832,  'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_D2s_v3',2,  8,    0.096,   'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_D4s_v3',4,  16,   0.192,   'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_F2s_v2',2,  4,    0.085,   'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_F4s_v2',4,  8,    0.169,   'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_E2s_v3',2,  16,   0.126,   'eastus'),
  ((SELECT id FROM cloud_providers WHERE name='azure'), 'Standard_E4s_v3',4,  32,   0.252,   'eastus');

-- GCP instances
INSERT INTO cloud_instances (provider_id, instance_type, vcpu, memory_gb, price_hourly, region) VALUES
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'e2-small',       2,  2,    0.0134,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'e2-medium',      2,  4,    0.0268,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n1-standard-1',  1,  3.75, 0.0475,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n1-standard-2',  2,  7.5,  0.0950,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n1-standard-4',  4,  15,   0.1900,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n2-standard-2',  2,  8,    0.0971,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n2-standard-4',  4,  16,   0.1942,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n2-highmem-2',   2,  16,   0.1312,  'us-central1'),
  ((SELECT id FROM cloud_providers WHERE name='gcp'), 'n2-highmem-4',   4,  32,   0.2624,  'us-central1');
COMMIT;

BEGIN;
-- ==========================================================
-- Inference Engines
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Minimum instance for self-hosting.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small','t3.medium','t3.large',
'Standard_B1ms','Standard_B2s','Standard_B2ms',
'e2-small','e2-medium','n1-standard-2','n2-standard-2'
)
WHERE t.name IN (
'Ollama',
'vLLM',
'LM Studio',
'llama.cpp',
'TensorRT-LLM',
'NVIDIA NIM'
);

-- ==========================================================
-- Agent Frameworks
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Runs comfortably on a medium application server.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small','t3.medium',
'Standard_B2s','Standard_B2ms',
'e2-medium','n2-standard-2'
)
WHERE t.name IN (
'LangGraph',
'CrewAI',
'AutoGen',
'Agno',
'PydanticAI',
'Semantic Kernel',
'Camel AI',
'SmolAgents',
'Mastra'
);

-- ==========================================================
-- Orchestration Frameworks
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Application server.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small','t3.medium',
'Standard_B2s','Standard_B2ms',
'e2-medium','n2-standard-2'
)
WHERE t.name IN (
'LangChain',
'LlamaIndex',
'Haystack',
'DSPy',
'Flowise',
'LangFlow',
'OpenPipe'
);

-- ==========================================================
-- LLM Gateways
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Gateway deployment.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small',
't3.medium',
't3.large',
'Standard_B2s',
'Standard_B2ms',
'Standard_D2s_v3',
'e2-medium',
'n2-standard-2'
)
WHERE t.name IN (
'LiteLLM',
'Kong AI Gateway',
'Gateway API (Custom)',
'Envoy AI Gateway'
);

-- ==========================================================
-- Prompt Engineering / Evaluation
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Self-hosted evaluation stack.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small',
't3.medium',
'Standard_B2s',
'Standard_B2ms',
'e2-medium',
'n2-standard-2'
)
WHERE t.name IN (
'Promptfoo',
'Ragas',
'DeepEval',
'TruLens',
'Giskard'
);

-- ==========================================================
-- Vector Databases
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Vector database.',
ci.instance_type IN (
'm5.large',
'Standard_D4s_v3',
'n2-highmem-4'
)
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
'm5.large',
'm5.xlarge',
'r5.large',
'r5.xlarge',
'Standard_D2s_v3',
'Standard_D4s_v3',
'Standard_E2s_v3',
'Standard_E4s_v3',
'n2-standard-4',
'n2-highmem-2',
'n2-highmem-4'
)
WHERE t.name IN (
'Weaviate',
'Milvus',
'Qdrant',
'Chroma',
'pgvector',
'Redis Vector',
'Elasticsearch',
'OpenSearch'
);

-- ==========================================================
-- Knowledge Graphs
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Database server.',
ci.instance_type IN (
'm5.large',
'Standard_D4s_v3',
'n2-highmem-2'
)
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
'm5.large',
'm5.xlarge',
'r5.large',
'Standard_D2s_v3',
'Standard_D4s_v3',
'Standard_E2s_v3',
'n2-standard-4',
'n2-highmem-2'
)
WHERE t.name IN (
'Neo4j',
'Memgraph',
'ArangoDB',
'GraphDB'
);

-- ==========================================================
-- Databases
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Database deployment.',
ci.instance_type IN (
'm5.large',
'Standard_D4s_v3',
'n2-highmem-2'
)
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
'm5.large',
'm5.xlarge',
'r5.large',
'r5.xlarge',
'Standard_D2s_v3',
'Standard_D4s_v3',
'Standard_E2s_v3',
'Standard_E4s_v3',
'n2-standard-4',
'n2-highmem-2',
'n2-highmem-4'
)
WHERE t.name IN (
'PostgreSQL',
'MySQL',
'SQL Server',
'MongoDB',
'Cassandra',
'Redis',
'Memcached',
'ClickHouse'
);

-- ==========================================================
-- Observability
-- ==========================================================

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Observability platform.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
't3.small',
't3.medium',
't3.large',
'Standard_B2s',
'Standard_B2ms',
'Standard_D2s_v3',
'e2-medium',
'n2-standard-2'
)
WHERE t.name IN (
'Langfuse',
'Helicone',
'OpenTelemetry',
'Evidently AI'
);

COMMIT;

-- ==========================================================
-- Embedding Models — Self-hosting (open-source only)
-- OpenAI Embeddings, Voyage AI, Cohere Embed = API-only, not self-hostable
-- BAAI BGE, Jina AI, Sentence Transformers, Nomic Embed, E5 Models = open source
-- ==========================================================

BEGIN;

INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Self-hosted embedding inference. CPU-only works for light loads; recommend 4+ vCPU / 8 GB RAM for production throughput.',
ci.instance_type IN ('t3.large','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
  't3.medium',
  't3.large',
  'm5.large',
  'Standard_B2ms',
  'Standard_D2s_v3',
  'Standard_D4s_v3',
  'e2-medium',
  'n2-standard-2',
  'n2-standard-4'
)
WHERE t.name IN (
  'BAAI BGE',
  'Jina AI',
  'Sentence Transformers',
  'Nomic Embed',
  'E5 Models'
)
ON CONFLICT (tool_id, instance_id) DO NOTHING;

COMMIT;

-- ==========================================================
-- RAG Components — Self-hosting
-- LlamaParse = API-only (LlamaCloud), no self-host
-- Cohere Rerank = API-only, no self-host
-- All others = open source / library components
-- ==========================================================

BEGIN;

-- Document parsers — moderate CPU/RAM for PDF/DOCX processing
INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Self-hosted document parser. Needs moderate CPU and memory for concurrent file processing.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
  't3.small','t3.medium','t3.large',
  'Standard_B2s','Standard_B2ms','Standard_D2s_v3',
  'e2-medium','n2-standard-2','n2-standard-4'
)
WHERE t.name IN (
  'Docling',
  'Unstructured',
  'Apache Tika',
  'Marker'
)
ON CONFLICT (tool_id, instance_id) DO NOTHING;

-- Orchestration frameworks — lightweight app servers
INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Runs as a Python application server. Minimal resource footprint.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
  't3.small','t3.medium',
  'Standard_B2s','Standard_B2ms',
  'e2-medium','n2-standard-2'
)
WHERE t.name IN (
  'LangChain',
  'LlamaIndex'
)
ON CONFLICT (tool_id, instance_id) DO NOTHING;

-- Pure library / in-process components — any app server works
INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Library component — runs in-process with your application. No dedicated server required.',
ci.instance_type IN ('t3.medium','Standard_B2ms','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
  't3.small','t3.medium',
  'Standard_B2s','Standard_B2ms',
  'e2-medium','n2-standard-2'
)
WHERE t.name IN (
  'Semantic Chunking',
  'Recursive Chunking',
  'Hybrid Search',
  'BM25',
  'Dense Retrieval',
  'Sparse Retrieval',
  'Parent Document Retrieval'
)
ON CONFLICT (tool_id, instance_id) DO NOTHING;

-- Neural rerankers — need more CPU/RAM for model inference
INSERT INTO tool_self_hosting (tool_id, instance_id, notes, is_recommended)
SELECT t.id, ci.id,
'Self-hosted cross-encoder / reranker inference. Recommend 4+ vCPU / 8 GB RAM for acceptable latency.',
ci.instance_type IN ('t3.large','Standard_D2s_v3','n2-standard-2')
FROM tools t
JOIN cloud_instances ci
ON ci.instance_type IN (
  't3.medium','t3.large','m5.large',
  'Standard_B2ms','Standard_D2s_v3','Standard_D4s_v3',
  'e2-medium','n2-standard-2','n2-standard-4'
)
WHERE t.name IN (
  'BGE Reranker',
  'Jina Reranker',
  'Cross Encoder'
)
ON CONFLICT (tool_id, instance_id) DO NOTHING;

COMMIT;


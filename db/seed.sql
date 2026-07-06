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
('AI21'),
('Grok'),
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

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.5',
       'GPT-5.5 model',
       35.00,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.5 Pro',
       'GPT-5.5 Pro model',
       210.00,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.4',
       'GPT-5.4 model',
       17.50,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.4 Mini',
       'GPT-5.4 Mini model',
       5.25,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.4 Nano',
       'GPT-5.4 Nano model',
       1.45,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

INSERT INTO plans (tool_id, name, description, price, billing_cycle)
SELECT id, 'GPT-5.4 Pro',
       'GPT-5.4 Pro model',
       210.00,
       'monthly'
FROM tools
WHERE name = 'OpenAI (GPT-4.1, o3, o4)';

-- ==========================
-- Claude
-- ==========================

INSERT INTO plans (tool_id, name, description, price)
SELECT id,'Claude Fable 5','Claude Fable 5',60
FROM tools WHERE name='Claude';

INSERT INTO plans (tool_id, name, description, price)
SELECT id,'Claude Opus 4.8','Claude Opus 4.8',30
FROM tools WHERE name='Claude';

INSERT INTO plans (tool_id, name, description, price)
SELECT id,'Claude Sonnet 4.6','Claude Sonnet 4.6',18
FROM tools WHERE name='Claude';

INSERT INTO plans (tool_id, name, description, price)
SELECT id,'Claude Haiku 4.5','Claude Haiku 4.5',6
FROM tools WHERE name='Claude';

-- ==========================
-- Gemini
-- ==========================

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Gemini 3.1 Pro','Gemini 3.1 Pro',14
FROM tools WHERE name='Gemini';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Gemini 3.0','Gemini 3.0',5
FROM tools WHERE name='Gemini';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Gemini 2.5 Pro','Gemini 2.5 Pro',6.25
FROM tools WHERE name='Gemini';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Gemini 2.5 Flash','Gemini 2.5 Flash',0.38
FROM tools WHERE name='Gemini';

-- ==========================
-- Llama
-- ==========================

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 4 Scout (Meta)','Meta Hosted',0.38
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.3 70B (DeepInfra)','DeepInfra',0.63
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.3 70B (Groq)','Groq',1.38
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.3 70B (Together AI)','Together AI',1.76
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.3 70B (Fireworks)','Fireworks AI',1.80
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.3 70B (Replicate)','Replicate',3.40
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 405B (DeepInfra)','DeepInfra',1.60
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 405B (Fireworks)','Fireworks AI',6.00
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 405B (Together)','Together AI',7.00
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 405B (Replicate)','Replicate',19.00
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 8B (Groq)','Groq',0.13
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 8B (DeepInfra)','DeepInfra',0.13
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 8B (Together)','Together AI',0.36
FROM tools WHERE name='Llama';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'Llama 3.1 8B (Fireworks)','Fireworks AI',0.40
FROM tools WHERE name='Llama';

-- ==========================
-- DeepSeek
-- ==========================

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'DeepSeek V4 Flash','Flash Model',0.42
FROM tools WHERE name='DeepSeek';

INSERT INTO plans (tool_id,name,description,price)
SELECT id,'DeepSeek V4 Pro','Pro Model',1.31
FROM tools WHERE name='DeepSeek';

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
    'Production',
    'Great for teams ready to deploy LLM apps in production. Not recommended for organizations requiring custom security controls or data residency guarantees.',
    49.00,
    'monthly',
    TRUE
FROM tools
WHERE name = 'Portkey';


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
    'Starter',
    'Starter Plan',
    9.99,
    'monthly',
    ARRAY[
        'Datasets on the cloud',
        'Custom evaluation metrics',
        'Online evals on live traffic',
        'Human annotation',
        'Chat simulations',
        'Downstream observability workflows',
        'Real-time alerting',
        'Trace data transformers',
        'Full Project API Access'
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
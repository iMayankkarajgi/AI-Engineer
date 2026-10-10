// Course pages: one page per track, written for people searching for that kind
// of course. Each is shown by src/Landing.jsx and prerendered for search
// engines. Facts such as module lists, lesson counts and prices are filled in
// from the course data, so they stay correct when the course changes.
export const landingPages = [
  {
    path: '/machine-learning-course', track: 'ml',
    eyebrow: 'Machine learning and deep learning course',
    h1: 'Machine Learning and Deep Learning Course for Beginners',
    title: 'Machine Learning Course for Beginners: ML and Deep Learning Online',
    description: 'Learn machine learning and deep learning online, from linear regression and gradient descent to neural networks and backpropagation, with videos, labs and quizzes.',
    lead: 'A step-by-step machine learning course that starts from zero. You learn how a model learns from data, how to tell a good model from a bad one, and how neural networks and deep learning work underneath.',
    learn: [
      'Supervised and unsupervised learning, and when to use each',
      'Linear regression and logistic regression, with the math explained slowly',
      'Loss functions, gradient descent and how training actually works',
      'Overfitting, regularisation, and precision versus recall',
      'Neural networks: neurons, activation functions, dropout and normalisation',
      'Backpropagation, step by step, with numbers you can follow',
      'Reinforcement learning and contrastive learning basics',
      'Recurrent neural networks, and how PyTorch and TensorFlow work inside',
    ],
    audience: [
      ['Complete beginners', 'who know a little Python and want a clear first machine learning course.'],
      ['Students', 'who want the concepts behind the formulas before an exam or interview.'],
      ['Software engineers', 'who use ML libraries and want to understand what they do.'],
    ],
    faqs: [
      ['Is this machine learning course suitable for beginners?', 'Yes. It assumes basic Python and school-level math. Every idea starts with an intuition and a picture before any formula.'],
      ['Does the course cover deep learning?', 'Yes. After the machine learning foundations it covers neural networks, backpropagation, normalisation, dropout and the path to Transformers.'],
      ['How much math do I need for machine learning?', 'School-level algebra is enough to start. The course explains the calculus and linear algebra it uses at the point where it needs them.'],
      ['Is there coding in the course?', 'Yes. Lessons include real Python code with a walkthrough, and the Practice page runs Python in your browser with nothing to install.'],
      ['What comes after machine learning and deep learning?', 'Generative AI: large language models, RAG and agents. Those are in the Generative AI Engineering track, and the Complete AI Engineer track includes both.'],
    ],
  },
  {
    path: '/generative-ai-course', track: 'ai',
    eyebrow: 'Generative AI and LLM course',
    h1: 'Generative AI Course: LLMs, RAG, Agents and Production Systems',
    title: 'Generative AI Course Online: LLMs, RAG, AI Agents and Fine-Tuning',
    description: 'A generative AI course for engineers: how LLMs and Transformers work, prompt engineering, RAG, vector databases, AI agents, fine-tuning, inference and evaluation.',
    lead: 'A generative AI course that goes inside the model and then out to the systems around it. You learn how large language models work, and how to build, serve, evaluate and secure real applications on top of them.',
    learn: [
      'How large language models work: tokens, embeddings and attention',
      'The Transformer architecture, piece by piece',
      'Sampling: temperature, top-k and top-p',
      'Prompt engineering and context engineering',
      'Retrieval-augmented generation (RAG): chunking, embeddings, vector databases, hybrid search and reranking',
      'AI agents: tool calling, the agent loop, memory, MCP and multi-agent systems',
      'Fine-tuning: LoRA, quantization, distillation, RLHF and DPO',
      'LLM inference: KV cache, batching, speculative decoding, vLLM and llama.cpp',
      'LLM evaluation, guardrails, prompt injection and AI system design',
    ],
    audience: [
      ['Software engineers', 'who want to build LLM features and understand why they behave as they do.'],
      ['ML engineers and data scientists', 'who are moving from classic machine learning to generative AI.'],
      ['Technical founders and product people', 'who need to judge what an LLM system can and cannot do.'],
    ],
    faqs: [
      ['What will I learn in this generative AI course?', 'How LLMs work inside, and how to build with them: prompting, RAG, agents, fine-tuning, serving, evaluation and safety.'],
      ['Do I need machine learning knowledge before generative AI?', 'It helps but is not required. The track starts with a starter lesson on the core terms. If you want the full foundations, take the Complete AI Engineer track.'],
      ['Does the course teach RAG and AI agents?', 'Yes. There are full modules on retrieval-augmented generation and on agents, including tool calling, agent memory, MCP and multi-agent systems.'],
      ['Is this a prompt engineering course?', 'Prompt engineering is one module. The course also covers what sits around the prompt: retrieval, tools, fine-tuning, inference and evaluation.'],
      ['Will I learn to fine-tune an LLM?', 'Yes. The fine-tuning module covers LoRA, quantization, knowledge distillation, RLHF, DPO and when fine-tuning is the wrong tool.'],
    ],
  },
  {
    path: '/ai-engineering-course', track: 'complete',
    eyebrow: 'AI engineering course',
    h1: 'AI Engineering Course: From Machine Learning to Production AI',
    title: 'AI Engineering Course Online: Become an AI Engineer Step by Step',
    description: 'The complete AI engineering course: machine learning, deep learning, LLMs, RAG, agents, inference, evaluation, AI system design and interview preparation.',
    lead: 'The full path to becoming an AI engineer in one course. It starts with machine learning and deep learning, goes inside large language models, and ends with production systems, system design and interview preparation.',
    learn: [
      'Machine learning foundations and deep learning',
      'Transformers and how large language models generate text',
      'Prompt engineering, context engineering and RAG',
      'AI agents, tool calling, memory and multi-agent systems',
      'Fine-tuning and model alignment',
      'LLM inference, serving and infrastructure: GPUs, batching, routing',
      'Evaluation, guardrails and AI security',
      'AI system design for interviews and real projects',
      'AI engineer interview preparation and a study plan',
    ],
    audience: [
      ['Career changers', 'who want one ordered path instead of scattered tutorials.'],
      ['Software engineers', 'aiming for an AI engineer or LLM engineer role.'],
      ['Students and new graduates', 'preparing for AI and ML engineering interviews.'],
    ],
    faqs: [
      ['What is an AI engineering course?', 'A course that teaches you to build products with AI models: the machine learning foundations, how LLMs work, and the engineering around them such as RAG, agents, serving and evaluation.'],
      ['How long does it take to become an AI engineer with this course?', 'The lessons, labs and quizzes add up to roughly 60 hours of study. At one or two lessons a day that is about three to four months.'],
      ['Do I get a certificate?', 'Yes. The certificate of completion is part of this track. It needs a pass in every lesson quiz and in the 50-question final exam.'],
      ['Does the course guarantee a job?', 'No course can. It gives you the knowledge, practice and interview preparation; building your own projects alongside it matters just as much.'],
      ['Can I start with a smaller track and upgrade later?', 'Yes. You can buy the Machine Learning and Deep Learning track or the Generative AI Engineering track first, and take this one later.'],
    ],
  },
];
export const landingByPath = Object.fromEntries(landingPages.map(p => [p.path, p]));

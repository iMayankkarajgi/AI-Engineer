// Course guide, glossary, and FAQs for AI Atlas.

export const guide = {
  about: {
    title: 'About this course',
    lead: 'A free, structured, step-by-step path to learn AI engineering from scratch: 19 modules and 149 interactive lessons, from the first idea of machine learning to designing complete AI systems.',
    body: [
      'We start with the basics of machine learning, then go inside the Transformer, see how an LLM generates text, learn how models are fine-tuned and aligned, build RAG systems and AI agents, make models fast and cheap to serve, evaluate and secure them, and finally design whole AI systems end to end.',
      'Every lesson here is self-contained. It explains one concept in simple words, then shows it moving: animated diagrams, charts that draw themselves, widgets you can drag, real code with real output, and side-by-side comparisons. You should never need to open another tab to understand a lesson.',
    ],
    points: [
      ['Free and open', 'No paywall. Your progress is saved in your browser, or in your account if you sign in.'],
      ['Beginner first', 'Every term is defined the first time it appears. Math is shown with small numbers you can follow.'],
      ['Deep, not shallow', 'Each lesson goes from “why do we need it” to “how it works step by step” to “where it is used”.'],
      ['In order, with checks', 'Each lesson ends with a 5-question quiz. Score 4 or more to unlock the next lesson.'],
    ],
  },
  whatIs: {
    title: 'What is AI engineering?',
    lead: 'AI engineering is the discipline of building real applications and systems on top of AI models, especially large language models (LLMs).',
    body: [
      'An AI engineer rarely trains a giant model from scratch. Instead, they understand how models work inside, choose the right model, give it the right context, connect it to tools and data, make it fast and affordable to run, measure whether it is doing a good job, keep it safe, and ship it to real users.',
    ],
    equation: ['Understand the model', 'Build on top of the model', 'Run the model in production'],
  },
  audience: {
    title: 'Who is this course for?',
    items: [
      ['Software engineers', 'moving into AI engineering.'],
      ['Backend, mobile and frontend developers', 'who want to build AI-powered products.'],
      ['ML engineers and data scientists', 'who want to go deep into LLMs, RAG and agents.'],
      ['Students and freshers', 'starting a career in AI.'],
      ['Engineering managers and tech leads', 'who need to understand how modern AI systems are built.'],
      ['Interview candidates', 'preparing for AI engineer, GenAI engineer and LLM engineer roles.'],
    ],
  },
  prerequisites: {
    title: 'Prerequisites',
    items: [
      ['Basic programming', 'Preferably Python. Most code examples are short Python programs, and every one shows its real output.'],
      ['High-school math', 'The linear algebra, calculus and probability we need is explained inside the lessons, step by step.'],
      ['Curiosity', 'That is all. No prior AI or machine-learning background is needed.'],
    ],
  },
  howTo: {
    title: 'How to use this course',
    items: [
      'Follow the modules in order. Each module builds on the previous one, and lessons unlock one after another.',
      'Inside a lesson, play with every interactive: move the sliders, step through the animations, press Run on the code.',
      'Use the “Pause and think” checks. Predict the answer before you reveal it.',
      'Take the 5-question quiz at the end. You need 4 correct answers to unlock the next lesson. Wrong answers come with explanations, and you can retry as often as you like.',
      'Do not skip Module 1 and Module 2. Everything later is built on them.',
      'After each module, explain its ideas to a friend in your own words. If you can explain it, you have learned it.',
    ],
  },
};

export const faqs = [
  ['What is the best way to learn AI engineering?', 'Follow a structured path in order: machine-learning foundations, deep learning, the Transformer, how LLMs generate text, fine-tuning and alignment, prompting and context, RAG, agents, inference, evaluation, safety, and finally system design. This course is organised exactly that way, and each lesson unlocks after you pass the previous one.'],
  ['Is this course free?', 'Yes. Every lesson, interactive and quiz is free. You can learn as a guest, and your progress is saved in your browser. Creating an account (on the self-hosted version) syncs your progress across devices.'],
  ['Do I need a machine-learning background?', 'No. The course starts from the very basics. Basic programming (preferably Python) and high-school math are enough; everything else is explained inside the lessons.'],
  ['How do the quiz and unlocking work?', 'Every lesson ends with 5 multiple-choice questions. Answer all five and submit. If you get 4 or more right, the lesson is marked as passed and the next lesson unlocks. If not, each question shows an explanation, and you can try again with the options shuffled.'],
  ['How long does it take to finish?', 'Most lessons take 12–25 minutes including the interactives and quiz. At one or two lessons a day, the full course takes around three to four months. Understanding each concept deeply matters more than speed.'],
  ['What is the difference between an AI engineer and a machine-learning engineer?', 'A machine-learning engineer mostly trains, tunes and deploys models. An AI engineer mostly builds products and systems on top of existing models, especially LLMs, using prompting, context engineering, RAG, agents, fine-tuning, inference optimisation and evaluation. The two overlap, and this course covers the foundations both need.'],
  ['What skills does an AI engineer need?', 'How LLMs work inside (Transformers, attention, tokenization); how to adapt them (prompting, context engineering, fine-tuning, LoRA); how to give them knowledge (RAG, vector search); how to make them act (agents, function calling, MCP); how to run them efficiently (inference, quantization, serving); how to measure and secure them (evaluation, observability, guardrails); and how to design complete systems.'],
  ['Does the course cover AI agents and agentic AI?', 'Yes. Module 10 covers agents in depth (function calling, the agent loop, ReAct, plan-and-execute, reflection, memory, MCP, skills, multi-agent systems, subagents, orchestration and computer-use agents), and Module 11 covers agentic engineering and frameworks such as LangChain, LangGraph, Claude Code and Cursor.'],
  ['Does it cover RAG?', 'Yes. Module 9 goes from vector databases and approximate nearest-neighbour search to semantic and hybrid search, rerankers, ColBERT, chunking, HyDE, caching, agentic RAG, GraphRAG and vectorless RAG.'],
  ['Does it cover LLM inference optimisation?', 'Yes. Module 12 covers prefill vs decode, disaggregation, the KV cache and its compression, paged attention, continuous batching, speculative decoding (n-gram, Medusa, EAGLE), quantization, GGUF, llama.cpp, vLLM, SGLang and TensorRT-LLM.'],
  ['Will this help me with AI engineering interviews?', 'Yes. The course covers the concepts asked in AI engineer, GenAI engineer, LLM engineer and ML engineer interviews, and Module 18 is dedicated to interview preparation, including a worked system-design answer.'],
  ['Where does the curriculum come from?', 'AI Atlas covers 19 core modules drawn from the established body of AI engineering knowledge — from ML fundamentals through inference optimization and agent systems. All lesson text, interactive widgets, code walkthroughs and quizzes are written specifically for this platform.'],
];

// { term, def, lesson }: lesson is the id of the lesson that teaches the term.
export const glossary = [
 {
  "term": "Generative AI",
  "def": "Generative AI is a type of artificial intelligence that can create new things, like text, images, audio, video, and code.",
  "lesson": "what-is-generative-ai"
 },
 {
  "term": "Language Model",
  "def": "A Language Model is a neural network trained to predict the next token (i.e. the next small chunk of text) based on the previous tokens.",
  "lesson": "small-language-models-slms"
 },
 {
  "term": "LLM Architecture",
  "def": "An LLM Architecture is the blueprint of a large language model. It describes how the model reads text, how it remembers what it has read, and how it produces the next word.",
  "lesson": "evolution-of-llm-architecture"
 },
 {
  "term": "Tokenization",
  "def": "The first step is to break the text into small pieces called tokens. Each token is then converted into a number. This process of breaking text into tokens is called tokenization.",
  "lesson": "bpe-in-llms"
 },
 {
  "term": "BPE (Byte Pair Encoding)",
  "def": "BPE (Byte Pair Encoding) is a tokenization algorithm that breaks text into pieces that are somewhere between characters and words.",
  "lesson": "bpe-in-llms"
 },
 {
  "term": "Embedding",
  "def": "An embedding is a list of numbers that represents the meaning of something, arranged so that things with similar meaning get similar numbers.",
  "lesson": "what-are-embeddings"
 },
 {
  "term": "Transformer",
  "def": "A Transformer is the architecture behind most modern AI models that work with language.",
  "lesson": "encoder-vs-decoder-in-transformers"
 },
 {
  "term": "Self Attention",
  "def": "Self Attention is a mechanism that allows every token in a sequence to look at every other token in the same sequence, including itself, to understand the context.",
  "lesson": "self-attention-in-transformers"
 },
 {
  "term": "Multi-Head Attention",
  "def": "Multi-Head Attention is a mechanism that runs many Self Attention operations in parallel, each with its own set of Q, K, and V projections, and then combines their outputs into a single richer representation.",
  "lesson": "multi-head-attention-in-transformers"
 },
 {
  "term": "Grouped-Query Attention (GQA)",
  "def": "Grouped-Query Attention (GQA) is a strategy where heads are divided into groups, and all heads within a group share the same Key and Value, while each head still has its own Query.",
  "lesson": "grouped-query-attention"
 },
 {
  "term": "Gradient Descent",
  "def": "Gradient Descent means going downward in the direction of the steepest slope.",
  "lesson": "math-behind-gradient-descent"
 },
 {
  "term": "Backpropagation",
  "def": "Backpropagation is a method used to calculate how much each weight in a neural network contributed to the error, so that we can adjust those weights to reduce the error.",
  "lesson": "math-behind-backpropagation"
 },
 {
  "term": "Reinforcement Learning",
  "def": "Reinforcement Learning, often called RL, is a type of machine learning where an Agent learns to make a sequence of decisions by interacting with an Environment, with the goal of maximizing a Reward over time.",
  "lesson": "reinforcement-learning"
 },
 {
  "term": "Contrastive Learning",
  "def": "Contrastive Learning is a way of teaching a model to learn good representations of data by comparing things. The model learns to pull similar things close to each other and push dissimilar things far apart in a representation space.",
  "lesson": "contrastive-learning"
 },
 {
  "term": "Top-p Sampling",
  "def": "Top-p Sampling is a decoding strategy in which we keep the smallest group of top tokens whose probabilities add up to at least p, throw away all the others, and then pick randomly from that group.",
  "lesson": "how-do-top-k-and-top-p-sampling-work"
 },
 {
  "term": "Token Streaming",
  "def": "Token streaming is a technique where the server sends the model's reply to us piece by piece, as each piece is produced, instead of waiting for the whole reply to be ready.",
  "lesson": "how-does-token-streaming-work"
 },
 {
  "term": "Lost in the Middle",
  "def": "The Lost in the Middle problem is the behaviour where an LLM pays strong attention to the information placed at the beginning and at the end of a long input, and pays very less attention to the information placed in the middle.",
  "lesson": "lost-in-the-middle-problem-in-llms"
 },
 {
  "term": "Large Reasoning Model (LRM)",
  "def": "Large Reasoning Model = A Large Language Model that is trained to think first, and answer later.",
  "lesson": "large-reasoning-models"
 },
 {
  "term": "Diffusion Language Model",
  "def": "A Diffusion Language Model is a type of AI model that writes text by starting from a piece of pure gibberish and slowly cleaning it up into a clear, meaningful sentence.",
  "lesson": "how-do-diffusion-language-models-dlms-work"
 },
 {
  "term": "Fine-tuning",
  "def": "Fine-tuning is the process of taking a model that is already trained and training it a little more on our own specific data so that it becomes good at our specific task.",
  "lesson": "how-does-fine-tuning-work"
 },
 {
  "term": "LoRA",
  "def": "LoRA is a way to fine-tune a large model without updating all of its weights. Instead of changing the original weight matrix, we keep it frozen and learn a tiny pair of extra matrices on the side.",
  "lesson": "lora-low-rank-adaptation-of-llms"
 },
 {
  "term": "Knowledge Distillation",
  "def": "Knowledge Distillation is a technique where we train a small model to copy the behavior of a large model.",
  "lesson": "how-does-knowledge-distillation-work"
 },
 {
  "term": "Continual Learning",
  "def": "Continual Learning is the ability of a model to keep learning new information over time, without forgetting what it has already learned.",
  "lesson": "continual-learning-in-llms"
 },
 {
  "term": "RLHF",
  "def": "RLHF (Reinforcement Learning from Human Feedback) is a training technique where we teach a Large Language Model (LLM) to produce responses that humans prefer, by collecting human preferences and converting them into a reward signal that guides further training.",
  "lesson": "reinforcement-learning-from-human-feedback-rlhf"
 },
 {
  "term": "Chain-of-Thought (CoT) Prompting",
  "def": "Chain-of-Thought (CoT) Prompting is a technique where we ask the model to write out its reasoning steps before giving the final answer.",
  "lesson": "how-does-chain-of-thought-prompting-work"
 },
 {
  "term": "Prompt Chaining",
  "def": "Prompt Chaining is a way of breaking one big task into smaller prompts, where the output of one prompt becomes the input of the next prompt.",
  "lesson": "how-does-prompt-chaining-work"
 },
 {
  "term": "Prompt Caching",
  "def": "Prompt Caching is a technique where the model saves the work it already did for a repeated part of a prompt, so that next time it can reuse that saved work instead of doing it all over again.",
  "lesson": "how-does-prompt-caching-work"
 },
 {
  "term": "Context Engineering",
  "def": "Context Engineering is the practice of designing, organizing, and managing everything that goes into an LLM's context window so that the model can do its task reliably.",
  "lesson": "context-engineering"
 },
 {
  "term": "Context Compaction",
  "def": "Context compaction is the technique of shrinking the old conversation into a short summary, so the important facts stay while the box gets free space again.",
  "lesson": "how-does-context-compaction-work"
 },
 {
  "term": "RAG (Retrieval-Augmented Generation)",
  "def": "RAG stands for Retrieval-Augmented Generation. It is a way to make an AI model answer using our own documents instead of only using what it already knows.",
  "lesson": "how-does-hyde-work"
 },
 {
  "term": "Chunk",
  "def": "A chunk is a small piece of text that we cut out from a bigger document.",
  "lesson": "chunking-strategies-for-rag"
 },
 {
  "term": "Hybrid Search",
  "def": "Hybrid Search is a technique that combines keyword search and semantic search, and merges their results into one final ranked list.",
  "lesson": "how-does-hybrid-search-work"
 },
 {
  "term": "Reranker",
  "def": "A Reranker is a model that takes a list of documents and reorders them, putting the most relevant ones at the top for a given question.",
  "lesson": "how-does-a-reranker-work"
 },
 {
  "term": "Semantic Caching",
  "def": "Semantic Caching is a cache that matches questions by their meaning instead of their exact words.",
  "lesson": "how-does-semantic-caching-work"
 },
 {
  "term": "Agentic RAG",
  "def": "Agentic RAG is a system where an AI Agent drives the retrieval process.",
  "lesson": "agentic-rag"
 },
 {
  "term": "AI Agent",
  "def": "AI Agent = An LLM + Instructions + Tools + Memory + A loop that runs until the goal is achieved.",
  "lesson": "ai-agent"
 },
 {
  "term": "Function Calling",
  "def": "Function Calling is a way to let an LLM use external tools, APIs, and functions to get things done. It is also called tool calling, and both names mean the same thing.",
  "lesson": "how-does-function-calling-work-in-llms"
 },
 {
  "term": "ReAct Agent",
  "def": "A ReAct Agent is an AI Agent built using the ReAct (Reasoning + Acting) pattern - the most common pattern for building AI Agents.",
  "lesson": "react-agent"
 },
 {
  "term": "MCP (Model Context Protocol)",
  "def": "MCP, which stands for Model Context Protocol, is an open standard that defines one common way for AI applications to connect to outside tools and data.",
  "lesson": "what-is-mcp-model-context-protocol"
 },
 {
  "term": "Agent Skill",
  "def": "An Agent Skill is a folder of instructions, and optionally scripts and reference files, that an AI agent loads by itself only when the task actually needs it.",
  "lesson": "what-are-agent-skills"
 },
 {
  "term": "OKF (Open Knowledge Format)",
  "def": "OKF, which stands for Open Knowledge Format, is an open standard for writing down what an organization knows about its data and systems, as a folder of plain markdown files, so that any AI agent or any tool can read that knowledge without custom work.",
  "lesson": "what-is-okf-open-knowledge-format"
 },
 {
  "term": "AI SubAgent",
  "def": "An AI SubAgent is a smaller, specialized agent that works under a main agent to handle a specific part of a larger task.",
  "lesson": "ai-subagents"
 },
 {
  "term": "AI Orchestration",
  "def": "AI Orchestration is the process of coordinating multiple AI components, such as LLMs, tools, data sources, and agents, to work together to finish a complex task.",
  "lesson": "ai-orchestration"
 },
 {
  "term": "Loop Engineering",
  "def": "Loop Engineering is the practice of designing the repeating cycle that an AI agent runs, so that the agent keeps making real progress on a task and stops at the right moment with the right result.",
  "lesson": "what-is-loop-engineering"
 },
 {
  "term": "Graph Engineering",
  "def": "Graph Engineering is the practice of designing an AI system as a graph, where every step of the work is a node and every path from one step to another step is an edge.",
  "lesson": "what-is-graph-engineering"
 },
 {
  "term": "LangChain",
  "def": "LangChain is a framework that helps us build applications powered by Large Language Models.",
  "lesson": "how-does-langchain-work"
 },
 {
  "term": "LangGraph",
  "def": "LangGraph is a framework that helps us build applications powered by an LLM, where the work is organized as a graph of steps.",
  "lesson": "how-does-langgraph-work"
 },
 {
  "term": "Claude Code",
  "def": "Claude Code is a coding agent from Anthropic that runs in the terminal. We give it a task in plain English, and it completes the task by reading our code, editing files, running commands, and checking its own work.",
  "lesson": "how-does-claude-code-work"
 },
 {
  "term": "Prefill",
  "def": "Prefill is the phase where the model reads and processes your entire input prompt in one single pass and produces the very first output token.",
  "lesson": "prefill-vs-decode-llm-inference-optimization"
 },
 {
  "term": "KV Cache Compression",
  "def": "KV Cache Compression is the set of techniques that make the KV Cache smaller while keeping the quality of the model output almost the same.",
  "lesson": "kv-cache-compression"
 },
 {
  "term": "Paged Attention",
  "def": "Paged Attention is a technique that manages KV Cache memory more efficiently by breaking it into small, fixed-size blocks called pages.",
  "lesson": "paged-attention-in-llms"
 },
 {
  "term": "Continuous Batching",
  "def": "Continuous Batching is a way of running batches where the server does not wait for the whole batch to finish. The moment any request in the batch finishes, the server immediately replaces it with a new request that is waiting in the queue.",
  "lesson": "continuous-batching-in-llms"
 },
 {
  "term": "Speculative Decoding",
  "def": "Speculative Decoding is a technique where we first guess the next few tokens quickly, and then ask the big model to verify all those guesses in one single run.",
  "lesson": "n-gram-speculation-in-llms"
 },
 {
  "term": "Model Quantization",
  "def": "Model Quantization is the process of storing and computing a model's numbers at lower precision, so the model takes less memory and runs faster.",
  "lesson": "how-does-model-quantization-work"
 },
 {
  "term": "GGUF",
  "def": "GGUF is a single file format that stores everything needed to run a large language model for local inference, all in one self-contained file.",
  "lesson": "how-does-gguf-work"
 },
 {
  "term": "vLLM",
  "def": "vLLM is a high-throughput engine for serving LLMs. It is built to serve as many requests as possible on a GPU by managing the KV cache memory very efficiently.",
  "lesson": "how-does-vllm-work"
 },
 {
  "term": "LLM Evaluation",
  "def": "LLM Evaluation is the process of measuring how well a Large Language Model performs on the tasks we expect it to do.",
  "lesson": "llm-evaluation"
 },
 {
  "term": "LLM as a Judge",
  "def": "LLM as a Judge is a technique where we use a large language model to evaluate the output of another large language model.",
  "lesson": "llm-as-a-judge"
 },
 {
  "term": "AI Agent Observability",
  "def": "AI Agent Observability is the practice of recording and understanding everything an AI Agent does internally, step by step, so that we can see why it behaved the way it did.",
  "lesson": "ai-agent-observability"
 },
 {
  "term": "LLM Guardrails",
  "def": "LLM guardrails are safety checks that sit around an LLM to control what goes in and what comes out.",
  "lesson": "how-do-llm-guardrails-work"
 },
 {
  "term": "Prompt Injection",
  "def": "Prompt Injection is an attack where someone slips their own instructions into the text that an AI application sends to the model, so that the model follows the attacker's instructions instead of the developer's instructions.",
  "lesson": "prompt-injection-in-llms"
 },
 {
  "term": "Diffusion Model",
  "def": "A Diffusion Model is a type of AI model that learns to create new data, such as images, by starting from pure random noise and slowly cleaning it up step by step until a clear image appears.",
  "lesson": "diffusion-models"
 },
 {
  "term": "Variational Autoencoder (VAE)",
  "def": "A Variational Autoencoder, also called a VAE, is a special type of Autoencoder that learns a smooth and organized latent space, so that we can pick any random point from it and generate brand new, meaningful data.",
  "lesson": "variational-autoencoders"
 },
 {
  "term": "LPU",
  "def": "An LPU is a chip that is built for one single job, running a large language model that is already trained, and producing text as fast as possible.",
  "lesson": "how-does-an-lpu-work"
 },
 {
  "term": "LLM Routing",
  "def": "LLM Routing is the practice of choosing the right LLM for each user query, instead of sending every query to the same LLM.",
  "lesson": "llm-routing"
 },
 {
  "term": "Voice AI Agent",
  "def": "A Voice AI Agent is a software program that we can talk to using our voice, and it talks back to us, just like a phone call with a human, but the one on the other side is an AI.",
  "lesson": "design-a-real-time-voice-ai-agent"
 },
 {
  "term": "World Model",
  "def": "A World Model is an AI that learns an approximate internal copy of how an environment behaves, so that it can predict what happens next, given the current state and an action.",
  "lesson": "how-do-world-models-work"
 },
 {
  "term": "Recursive Self-Improvement",
  "def": "Recursive Self-Improvement is a process in which an AI system improves its own abilities, and then the improved version improves itself further, and this cycle keeps repeating.",
  "lesson": "what-is-recursive-self-improvement-rsi"
 }
];

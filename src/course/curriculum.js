// AI Engineer Bootcamp curriculum — 19 modules, 149 lessons.
// Lesson bodies live in ./lessons/<id>.js
export const modules = [
 {
  "id": "must-know",
  "number": 1,
  "title": "AI Engineering Starter Kit",
  "short": "Starter Kit",
  "icon": "◎",
  "accent": "#ffd9a8",
  "stage": "Start Here",
  "intro": [
   "Before going deep, we meet the six words that come up in every AI engineering conversation: LLM, RAG, MCP, Agent, Fine-tuning and Quantization."
  ],
  "lessons": [
   {
    "id": "six-words-of-ai-engineering",
    "num": "1.1",
    "title": "Six Concepts Every AI Engineer Must Know",
    "source": "",
    "covers": [
     "What an LLM is",
     "What RAG is",
     "What MCP is",
     "What an Agent is",
     "What Fine-tuning is",
     "What Quantization is",
     "How the six fit together in one real product"
    ]
   }
  ]
 },
 {
  "id": "ml-foundations",
  "number": 2,
  "title": "Learning from Data",
  "short": "ML Basics",
  "icon": "∿",
  "accent": "#b4f4d0",
  "stage": "Foundations",
  "intro": [
   "In this module, we will learn what Machine Learning is, the different ways a machine can learn, and the basic terms we will keep using in every later module of this AI Engineering Course.",
   "By the end of this module, we will know how a model learns from data, how we measure it, and how we stop it from overfitting."
  ],
  "lessons": [
   {
    "id": "machine-learning",
    "num": "2.1",
    "title": "Machine Learning from First Principles",
    "source": "",
    "covers": []
   },
   {
    "id": "supervised-vs-unsupervised-learning",
    "num": "2.2",
    "title": "Labeled vs Unlabeled: Two Ways Machines Learn",
    "source": "",
    "covers": [
     "Supervised Learning",
     "Unsupervised Learning",
     "Differences Between Supervised and Unsupervised Learning"
    ]
   },
   {
    "id": "linear-regression-vs-logistic-regression",
    "num": "2.3",
    "title": "Predicting Numbers vs Categories: Regression Compared",
    "source": "",
    "covers": [
     "Linear Regression",
     "Logistic Regression",
     "Differences Between Linear Regression and Logistic Regression"
    ]
   },
   {
    "id": "feature-engineering",
    "num": "2.4",
    "title": "Feature Engineering: Turning Raw Data into Signal",
    "source": "",
    "covers": []
   },
   {
    "id": "precision-vs-recall",
    "num": "2.5",
    "title": "Precision and Recall: Picking the Right Metric",
    "source": "",
    "covers": [
     "The problem we are trying to solve",
     "The four possible outcomes",
     "What is Precision?",
     "What is Recall?",
     "Precision vs Recall",
     "When to use which one?",
     "A quick recap of the formulas",
     "Summary"
    ]
   },
   {
    "id": "l1-and-l2-loss-functions",
    "num": "2.6",
    "title": "L1 vs L2 Loss: Choosing Your Error Penalty",
    "source": "",
    "covers": [
     "L1 Loss Function",
     "L2 Loss Function",
     "How to decide between L1 and L2 Loss Function?"
    ]
   },
   {
    "id": "regularization-in-machine-learning",
    "num": "2.7",
    "title": "Regularization: Stopping Overfitting with L1 and L2",
    "source": "",
    "covers": [
     "What is overfitting?",
     "L1 Regularization or Lasso Regularization",
     "L2 Regularization or Ridge Regularization"
    ]
   },
   {
    "id": "reinforcement-learning",
    "num": "2.8",
    "title": "Reinforcement Learning: Teaching Agents Through Reward",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is Reinforcement Learning?",
     "A Simple Real-World Analogy",
     "The Building Blocks of RL",
     "The Reinforcement Learning Loop",
     "Reinforcement Learning vs Supervised vs Unsupervised Learning",
     "Episode, Return, and Discount Factor",
     "Exploration vs Exploitation",
     "Common Families of RL Algorithms",
     "Where Is Reinforcement Learning Used?",
     "Why Reinforcement Learning Is Hard",
     "Quick Summary"
    ]
   },
   {
    "id": "contrastive-learning",
    "num": "2.9",
    "title": "Contrastive Learning: Training by Comparison",
    "source": "",
    "covers": [
     "What is Contrastive Learning?",
     "Why do we need Contrastive Learning?",
     "The key idea behind Contrastive Learning.",
     "Positive pairs and Negative pairs.",
     "How does Contrastive Learning work step-by-step?",
     "Loss functions used in Contrastive Learning.",
     "Popular Contrastive Learning methods.",
     "Real-world use cases of Contrastive Learning.",
     "[Feature Engineering in Machine Learning](https://www.youtube.com/watch?v=QLlywrWuXag) (Video)",
     "[One-hot Encoding in Machine Learning](https://www.youtube.com/watch?v=6AmedU5i9go) (Video)"
    ]
   }
  ]
 },
 {
  "id": "deep-learning",
  "number": 3,
  "title": "Neural Architectures Deep Dive",
  "short": "Neural Nets",
  "icon": "⬡",
  "accent": "#b8ddff",
  "stage": "Foundations",
  "intro": [
   "In this module, we will learn how a neural network actually learns. We will understand the math behind gradient descent and backpropagation step by step, and the techniques that make training stable.",
   "By the end of this module, we will be able to explain how a neural network trains, from the forward pass to the weight update, and why normalization and dropout matter."
  ],
  "lessons": [
   {
    "id": "bias-in-artificial-neural-network",
    "num": "3.1",
    "title": "Neural Network Bias: What It Is and Why It Matters",
    "source": "",
    "covers": []
   },
   {
    "id": "math-behind-gradient-descent",
    "num": "3.2",
    "title": "Gradient Descent: Rolling Downhill to the Optimum",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is a Loss Function",
     "What is Gradient Descent",
     "The Intuition Behind Gradient Descent",
     "The Math Behind Gradient Descent",
     "Step-by-Step Numeric Example",
     "Gradient Descent with Multiple Parameters",
     "The Role of Learning Rate",
     "Types of Gradient Descent",
     "Gradient Descent in Python",
     "Putting It All Together"
    ]
   },
   {
    "id": "math-behind-backpropagation",
    "num": "3.3",
    "title": "Backpropagation: How Neural Networks Learn from Mistakes",
    "source": "",
    "covers": [
     "What is Backpropagation?",
     "The Chain Rule of Calculus",
     "Forward Pass",
     "Loss Calculation",
     "Backward Pass (Backpropagation)",
     "Step-by-Step Numeric Example",
     "Weight Update Using Gradient Descent",
     "Backpropagation in Python"
    ]
   },
   {
    "id": "math-behind-cross-entropy-loss",
    "num": "3.4",
    "title": "Cross-Entropy Loss: Scoring Probability Predictions",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is Cross-Entropy",
     "The Cross-Entropy Loss Formula",
     "Why We Take the Negative Log",
     "Binary Cross-Entropy Loss",
     "Categorical Cross-Entropy Loss",
     "Step-by-Step Numeric Example",
     "Cross-Entropy Loss for Language Models",
     "The Gradient of Cross-Entropy Loss",
     "Quick Summary"
    ]
   },
   {
    "id": "dropout-in-neural-networks",
    "num": "3.5",
    "title": "Dropout: Controlled Forgetting as Regularization",
    "source": "",
    "covers": [
     "What is Dropout?",
     "The problem of Overfitting",
     "Why do we need Dropout?",
     "How does Dropout work?",
     "A step-by-step example",
     "Dropout during training vs testing",
     "Dropout in code",
     "Variants of Dropout",
     "Advantages of Dropout",
     "Where Dropout is used"
    ]
   },
   {
    "id": "batch-normalization-vs-layer-normalization",
    "num": "3.6",
    "title": "Batch Norm vs Layer Norm: When to Use Each",
    "source": "",
    "covers": [
     "What is Normalization?",
     "Why do we need Normalization?",
     "What is Batch Normalization?",
     "What is Layer Normalization?",
     "Batch Normalization vs Layer Normalization",
     "When to use which one?"
    ]
   },
   {
    "id": "rmsnorm-root-mean-square-layer-normalization",
    "num": "3.7",
    "title": "RMSNorm: Simpler Normalization for Transformers",
    "source": "",
    "covers": [
     "Why normalization is needed in deep networks",
     "A quick recap of Layer Normalization (LayerNorm)",
     "What RMSNorm is and how it works",
     "The math behind RMSNorm with a concrete numeric example",
     "LayerNorm vs RMSNorm - the key differences",
     "Why modern LLMs prefer RMSNorm",
     "A code example",
     "Where RMSNorm fits in a Transformer",
     "Quick Summary"
    ]
   },
   {
    "id": "recurrent-neural-network",
    "num": "3.8",
    "title": "Recurrent Neural Networks: Processing Sequences in Order",
    "source": "",
    "covers": []
   },
   {
    "id": "how-does-pytorch-work",
    "num": "3.9",
    "title": "PyTorch Internals: Dynamic Graphs and Autograd",
    "source": "",
    "covers": [
     "What is PyTorch?",
     "What is a Tensor?",
     "The problem PyTorch solves",
     "What is a Computation Graph?",
     "What is Autograd?",
     "A complete training example",
     "What is the GPU and why does PyTorch use it?",
     "Why is PyTorch so popular?"
    ]
   },
   {
    "id": "how-does-the-machine-learning-library-tensorflow-work",
    "num": "3.10",
    "title": "TensorFlow Explained: Static Graphs and Production ML",
    "source": "",
    "covers": []
   }
  ]
 },
 {
  "id": "transformers",
  "number": 4,
  "title": "Transformers and How They Think",
  "short": "Transformers",
  "icon": "✳",
  "accent": "#d4c4ff",
  "stage": "Core",
  "intro": [
   "In this module, we will learn what Generative AI is and how the Transformer, the architecture behind every modern LLM, works from the inside. We will go from tokens to embeddings to attention, one piece at a time.",
   "By the end of this module, we will be able to draw the Transformer from memory and explain every block inside it, including the math behind Q, K, and V."
  ],
  "lessons": [
   {
    "id": "what-is-generative-ai",
    "num": "4.1",
    "title": "Generative AI: Creating Instead of Classifying",
    "source": "",
    "covers": [
     "What is Generative AI?",
     "Generative AI = Generative + AI",
     "What does \"generate\" mean here?",
     "How is Generative AI different from the old AI?",
     "How does Generative AI learn?",
     "How does Generative AI actually create something new?",
     "What can Generative AI create?",
     "What is a model in Generative AI?",
     "The complete flow of Generative AI",
     "Where do we use Generative AI every day?",
     "The limitations we must know",
     "Summary"
    ]
   },
   {
    "id": "autoregressive-models",
    "num": "4.2",
    "title": "Autoregressive Models: Predicting One Token at a Time",
    "source": "",
    "covers": [
     "What is an Autoregressive Model?",
     "The Chain Rule of Probability",
     "The Generation Loop",
     "Step-by-Step Numeric Example",
     "Why GPT-style Models are Autoregressive",
     "Why Autoregressive Models Need Causal Masking",
     "The Connection with KV Cache",
     "Autoregressive vs Non-Autoregressive Generation",
     "Popular Autoregressive Models we should know",
     "Pros and Cons of Autoregressive Models",
     "Quick Summary"
    ]
   },
   {
    "id": "bpe-in-llms",
    "num": "4.3",
    "title": "BPE Tokenization: How LLMs Split Text into Tokens",
    "source": "",
    "covers": [
     "What is Tokenization?",
     "The Problem: How to Break Text into Tokens?",
     "What is BPE (Byte Pair Encoding)?",
     "How BPE Works: Step by Step",
     "How BPE Tokenizes New Text",
     "Why BPE is Used in Modern LLMs"
    ]
   },
   {
    "id": "what-are-embeddings",
    "num": "4.4",
    "title": "Embeddings: Encoding Meaning as Vectors",
    "source": "",
    "covers": [
     "The problem: computers cannot compare meaning",
     "What are Embeddings?",
     "A simple example with two numbers",
     "Why we need many more than two numbers",
     "How do we measure closeness?",
     "Where do embeddings come from?",
     "The famous word math example",
     "Embeddings are not only for words",
     "What we use embeddings for",
     "Things we must be careful about",
     "Summary"
    ]
   },
   {
    "id": "how-do-rnns-and-transformers-differ",
    "num": "4.5",
    "title": "RNNs vs Transformers: A Fundamental Architecture Shift",
    "source": "",
    "covers": [
     "What both of them are for",
     "What is an RNN?",
     "The problem with an RNN",
     "What is a Transformer?",
     "The key difference in one line",
     "RNN vs Transformer side by side",
     "Let's tabulate the difference",
     "When to use which one?",
     "Summary"
    ]
   },
   {
    "id": "decoding-transformer-architecture",
    "num": "4.6",
    "title": "The Transformer Architecture: Built on Attention",
    "source": "",
    "covers": [
     "Why the Transformer was needed",
     "The two halves of the architecture",
     "Tokenization, Embedding, and Positional Encoding",
     "The Attention Mechanism and Multi-Head Attention",
     "Feed-Forward Networks, Residual Connections, and Layer Normalization",
     "How the Encoder and Decoder work",
     "How data flows through the entire architecture",
     "The three variants of the Transformer",
     "Why the Transformer is so powerful"
    ]
   },
   {
    "id": "encoder-vs-decoder-in-transformers",
    "num": "4.7",
    "title": "Encoder vs Decoder: Two Sides of the Transformer",
    "source": "",
    "covers": [
     "What is a Transformer?",
     "A word about tokens",
     "What is an Encoder?",
     "What is a Decoder?",
     "The one big difference",
     "The three types of Transformers",
     "Let's tabulate the difference",
     "When to use which one?",
     "Summary"
    ]
   },
   {
    "id": "self-attention-in-transformers",
    "num": "4.8",
    "title": "Self-Attention: How Tokens See One Another",
    "source": "",
    "covers": [
     "What is Self Attention?",
     "Why do we need Self Attention?",
     "Query, Key, and Value vectors",
     "Step-by-step working of Self Attention",
     "A simple example walk-through",
     "Why Self Attention works so well",
     "Multi-Head Self Attention",
     "Where Self Attention is used"
    ]
   },
   {
    "id": "math-behind-attention-qkv",
    "num": "4.9",
    "title": "Attention Math: Queries, Keys, and Values Unpacked",
    "source": "",
    "covers": [
     "The Attention Formula",
     "Setting Up: From Words to Vectors",
     "Creating Q, K, and V Matrices",
     "Computing Attention Scores (Q x K^T)",
     "Scaling the Scores",
     "Applying Softmax",
     "Computing the Final Output (Attention Weights x V)",
     "Putting It All Together"
    ]
   },
   {
    "id": "scaling-dot-product-attention",
    "num": "4.10",
    "title": "Scaled Dot-Product Attention: Why We Divide by √dₖ",
    "source": "",
    "covers": [
     "The Attention Formula (Quick Recap)",
     "What Happens Without Scaling?",
     "Why Do Dot Products Grow with dₖ?",
     "Understanding Variance of the Dot Product",
     "Proving It Step by Step: Variance of the Dot Product is dₖ",
     "What Large Dot Products Do to Softmax",
     "Why √dₖ is the Right Scaling Factor",
     "Seeing It with Real Numbers",
     "Putting It All Together"
    ]
   },
   {
    "id": "causal-masking-in-attention",
    "num": "4.11",
    "title": "Causal Masking: Preventing the Model from Seeing the Future",
    "source": "",
    "covers": [
     "Without Causal Masking",
     "With Causal Masking",
     "Implementation of Causal Masking",
     "The Causal Mask Matrix"
    ]
   },
   {
    "id": "multi-head-attention-in-transformers",
    "num": "4.12",
    "title": "Multi-Head Attention: Many Perspectives at Once",
    "source": "",
    "covers": [
     "What is Multi-Head Attention?",
     "A quick recap of Self Attention",
     "Why do we need Multi-Head Attention?",
     "Step-by-step working of Multi-Head Attention",
     "A simple example walk-through",
     "Where Multi-Head Attention is used",
     "Advantages of Multi-Head Attention"
    ]
   },
   {
    "id": "cross-attention-in-transformers",
    "num": "4.13",
    "title": "Cross-Attention: Connecting Encoder Output to the Decoder",
    "source": "",
    "covers": [
     "What is Cross Attention?",
     "Why do we need Cross Attention?",
     "Query, Key, and Value in Cross Attention",
     "Self Attention vs Cross Attention",
     "Step-by-step working of Cross Attention",
     "A simple example walk-through",
     "Where Cross Attention is used",
     "Importance of Cross Attention"
    ]
   },
   {
    "id": "math-behind-rope-rotary-position-embedding",
    "num": "4.14",
    "title": "Rotary Position Encoding: Position Without Fixed Lookup Tables",
    "source": "",
    "covers": [
     "The Big Picture",
     "Why a Transformer Needs Position Information",
     "Older Approaches and Their Problems",
     "The Core Idea Behind RoPE",
     "The 2D Rotation Math",
     "How RoPE Is Applied to Q and K",
     "Why the Dot Product Captures Relative Position",
     "A Small Numeric Example",
     "Real-World Use Cases",
     "Quick Summary"
    ]
   },
   {
    "id": "feed-forward-networks-in-llms",
    "num": "4.15",
    "title": "Feed-Forward Networks: The Transformer's Memory Layer",
    "source": "",
    "covers": [
     "What is a Feed-Forward Network?",
     "Understanding Feed-Forward Networks with a Real-World Analogy",
     "Where Does the Feed-Forward Network Sit in a Transformer?",
     "How Does a Feed-Forward Network Work - Step by Step",
     "The Expand-then-Contract Pattern",
     "Why Does the FFN Expand and Then Contract?",
     "ReLU and Activation Functions",
     "What Does the Feed-Forward Network Actually Learn?",
     "How Much of the Model is the Feed-Forward Network?",
     "Feed-Forward Networks in Mixture of Experts",
     "Why Feed-Forward Networks Are So Important",
     "[Softmax Activation Function in Machine Learning](https://www.youtube.com/watch?v=2Zx6x01WwWM) (Video)",
     "Inside ChatGPT: What happens token by token",
     "[Tokenization in Large Language Models (LLMs)](https://www.youtube.com/watch?v=sK2s9I84EVI) (Video)",
     "[Embeddings in Machine Learning](https://www.youtube.com/watch?v=LedXW6xl21s) (Video)",
     "Positional embeddings: how transformers track order"
    ]
   }
  ]
 },
 {
  "id": "generation",
  "number": 5,
  "title": "Inside the LLM Output Pipeline",
  "short": "Output Pipeline",
  "icon": "⌁",
  "accent": "#ffc4dd",
  "stage": "Core",
  "intro": [
   "In this module, we will learn how an LLM picks the next token, how we control its creativity, how the output reaches the user token by token, and where the context window fails.",
   "By the end of this module, we will know exactly what happens between the prompt and the final answer, and which knobs change the output."
  ],
  "lessons": [
   {
    "id": "how-does-temperature-control-llm-output",
    "num": "5.1",
    "title": "Temperature Sampling: Dialing Up or Down Creativity",
    "source": "",
    "covers": [
     "What is Temperature in LLMs?",
     "How does an LLM pick the next token?",
     "From scores to probabilities",
     "Where does Temperature come into the picture?",
     "Step-by-step example with numbers",
     "Low Temperature",
     "High Temperature",
     "Temperature = 1 and Temperature = 0",
     "Why is it called Temperature?",
     "When to use which Temperature?",
     "Common mistakes while using Temperature"
    ]
   },
   {
    "id": "how-do-top-k-and-top-p-sampling-work",
    "num": "5.2",
    "title": "Nucleus Sampling: Top-k and Top-p Demystified",
    "source": "",
    "covers": [
     "How an LLM picks the next token",
     "The problem with always picking the best token",
     "The problem with picking from every token",
     "What is Top-k Sampling?",
     "Step-by-step example of Top-k Sampling",
     "The problem with Top-k Sampling",
     "What is Top-p Sampling?",
     "Step-by-step example of Top-p Sampling",
     "Top-k vs Top-p Sampling",
     "How Top-k and Top-p work with Temperature",
     "When to use which one"
    ]
   },
   {
    "id": "how-does-token-streaming-work",
    "num": "5.3",
    "title": "Token Streaming: Rendering Outputs as They Arrive",
    "source": "",
    "covers": [
     "What is token streaming",
     "A quick recap of how an LLM generates text",
     "Why we need streaming at all",
     "What is SSE",
     "How the HTTP connection stays open",
     "The format of a streamed message",
     "A full walkthrough from server to screen",
     "The [DONE] marker that ends the stream",
     "SSE vs WebSockets",
     "Token streaming in the real world"
    ]
   },
   {
    "id": "lost-in-the-middle-problem-in-llms",
    "num": "5.4",
    "title": "Lost in the Middle: Why LLMs Miss Central Context",
    "source": "",
    "covers": [
     "What is a context window",
     "What is the Lost in the Middle problem",
     "Let's understand it with an example",
     "The U-shaped curve",
     "Why does this happen",
     "Where this hurts us in real life",
     "How to test for the Lost in the Middle problem",
     "How to solve the Lost in the Middle problem",
     "Key points to remember",
     "[Why is the context window limited in LLMs?](https://www.youtube.com/watch?v=CGIhxIaOg3M) (Video)"
    ]
   }
  ]
 },
 {
  "id": "modern-architecture",
  "number": 6,
  "title": "Next-Gen LLM Architectures",
  "short": "Modern Architectures",
  "icon": "▦",
  "accent": "#a8f0ff",
  "stage": "Core",
  "intro": [
   "In this module, we will learn the improvements that modern LLMs add on top of the basic Transformer to become bigger, faster, and able to handle longer inputs. At the end, we will see all of these ideas together inside a real model.",
   "By the end of this module, we will be able to read the architecture section of any new open-weight model and understand every design choice in it."
  ],
  "lessons": [
   {
    "id": "evolution-of-llm-architecture",
    "num": "6.1",
    "title": "A Timeline of LLM Architecture Improvements",
    "source": "",
    "covers": [
     "What is an LLM Architecture?",
     "Stage 1: Reading one word at a time (RNN)",
     "Stage 2: Attention",
     "Stage 3: The Transformer",
     "Stage 4: Scaling",
     "Stage 5: Mixture of Experts (MoE)",
     "Stage 6: New Directions",
     "Summary of the evolution"
    ]
   },
   {
    "id": "mixture-of-experts",
    "num": "6.2",
    "title": "Mixture of Experts: Routing Tokens to Specialists",
    "source": "",
    "covers": [
     "Why Mixture of Experts was needed",
     "What an \"expert\" really means",
     "The router and how it picks experts",
     "Where MoE sits inside a Transformer",
     "Sparse activation and why it saves compute",
     "Load balancing across experts",
     "Advantages and challenges of MoE",
     "Why MoE powers many modern LLMs"
    ]
   },
   {
    "id": "grouped-query-attention",
    "num": "6.3",
    "title": "Grouped Query Attention: Fewer KV Heads, Same Quality",
    "source": "",
    "covers": [
     "The Big Picture",
     "Quick Recap: Multi-Head Attention (MHA)",
     "The Problem with Multi-Head Attention",
     "What is Multi-Query Attention (MQA)?",
     "What is Grouped-Query Attention (GQA)?",
     "How Grouped-Query Attention Works",
     "GQA is a Generalization of MHA and MQA",
     "GQA vs MHA vs MQA",
     "Real-World Use Cases",
     "A Note on Terminology",
     "Uptraining: Converting MHA to GQA",
     "Quick Summary"
    ]
   },
   {
    "id": "how-does-sliding-window-attention-work",
    "num": "6.4",
    "title": "Sliding Window Attention: Taming Very Long Contexts",
    "source": "",
    "covers": [
     "What is attention?",
     "The problem with normal attention",
     "What is sliding window attention?",
     "A simple step-by-step walkthrough",
     "How information still travels far away",
     "Comparing normal attention and sliding window attention",
     "Where sliding window attention is used",
     "Advantages and trade-offs"
    ]
   },
   {
    "id": "how-do-attention-sinks-work",
    "num": "6.5",
    "title": "Attention Sinks: The Hidden Cost of Extended Context",
    "source": "",
    "covers": [
     "What is a Large Language Model",
     "What is attention",
     "The problem of streaming with long conversations",
     "The naive fix and why it fails",
     "What is an attention sink",
     "Why the first tokens become a sink",
     "A step-by-step numeric walkthrough",
     "The fix in code",
     "StreamingLLM and modern attention sinks",
     "Importance of attention sinks"
    ]
   },
   {
    "id": "decoding-flash-attention",
    "num": "6.6",
    "title": "Flash Attention: Memory-Efficient Attention at Scale",
    "source": "",
    "covers": [
     "A quick recap of standard attention",
     "Why standard attention is slow",
     "How GPU memory actually works (HBM vs SRAM)",
     "The core idea behind Flash Attention",
     "Tiling: breaking the work into small blocks",
     "Online softmax: computing softmax without the full matrix",
     "Recomputation in the backward pass",
     "Flash Attention 2",
     "Flash Attention 3",
     "Advantages and impact of Flash Attention"
    ]
   },
   {
    "id": "decoding-deepseek-v4",
    "num": "6.7",
    "title": "DeepSeek-V4: Anatomy of an Open-Source Frontier Model",
    "source": "",
    "covers": [
     "The Big Picture",
     "Two Models: DeepSeek-V4-Pro and DeepSeek-V4-Flash",
     "Hybrid Attention with CSA and HCA",
     "Manifold-Constrained Hyper-Connections (mHC)",
     "Muon Optimizer",
     "FP4 Quantization-Aware Training",
     "Pre-Training",
     "Post-Training: Specialist Training and On-Policy Distillation",
     "Reasoning Modes",
     "Putting It All Together",
     "Quick Summary"
    ]
   }
  ]
 },
 {
  "id": "model-types",
  "number": 7,
  "title": "The Language Model Zoo",
  "short": "Model Types",
  "icon": "◇",
  "accent": "#f4e7a8",
  "stage": "Core",
  "intro": [
   "In this module, we will learn that not every language model is a large, text-generating LLM. We will see the smaller, reasoning, recursive, diffusion-based, and decision-only models and when to use which one.",
   "By the end of this module, we will know which type of model to pick for a given problem."
  ],
  "lessons": [
   {
    "id": "small-language-models-slms",
    "num": "7.1",
    "title": "Small Language Models: Big Capability in Compact Form",
    "source": "",
    "covers": [
     "SLM = Small + Language Model",
     "What is a Language Model?",
     "What Counts as \"Small\"?",
     "Popular SLMs we should know",
     "How SLMs Stay Capable Despite Being Small",
     "Why SLMs Matter",
     "SLM vs LLM",
     "The Size Spectrum",
     "Where SLMs Shine - Use Cases",
     "Trade-offs of SLMs",
     "When to Pick an SLM",
     "Quick Summary"
    ]
   },
   {
    "id": "large-reasoning-models",
    "num": "7.2",
    "title": "Large Reasoning Models: Chain-of-Thought at Inference Time",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is a Large Reasoning Model (LRM)?",
     "LLM vs LRM",
     "How does an LRM actually think?",
     "Test-time compute: thinking longer makes them smarter",
     "How are LRMs trained?",
     "Input and Output: training phase vs prediction phase",
     "When to use an LRM, and when to use a regular LLM",
     "Popular LRMs we should know",
     "Common Mistakes when using LRMs",
     "Quick Summary"
    ]
   },
   {
    "id": "recursive-language-models",
    "num": "7.3",
    "title": "Recursive Language Models: Self-Referential Generation",
    "source": "",
    "covers": [
     "What is a Recursive Language Model (RLM)?",
     "Why do we need RLMs?",
     "How an RLM works",
     "How the model writes and runs code",
     "Why RLMs work better",
     "Recursion inside RLMs",
     "How RLMs differ from simple chunking",
     "Advantages of RLMs",
     "Limitations of RLMs",
     "When to use RLMs",
     "RLM vs RAG",
     "A real use case"
    ]
   },
   {
    "id": "how-do-diffusion-language-models-dlms-work",
    "num": "7.4",
    "title": "Diffusion Language Models: Text Generation Beyond Autoregression",
    "source": "",
    "covers": [
     "What is a Diffusion Language Model?",
     "How do today's language models write text?",
     "The problem with the usual approach",
     "Where the diffusion idea comes from",
     "What does \"noise\" mean for text?",
     "The two phases: forward and reverse",
     "How a DLM actually generates text, step by step",
     "A tiny end-to-end example",
     "A simple code-style walk-through",
     "DLMs vs the usual language models",
     "Advantages of DLMs",
     "Limitations of DLMs",
     "The current state"
    ]
   },
   {
    "id": "jev-and-system-one-models-explained",
    "num": "7.5",
    "title": "Jev and System One: Fast vs Deliberate AI Thinking",
    "source": "",
    "covers": [
     "What is a System One Model?",
     "System One vs System Two Thinking",
     "The Problem with Using an LLM for Decisions",
     "What is Jev?",
     "How Jev Works",
     "Typed Answers: Choice, Score, and Yes/No",
     "Calibration and RLCD",
     "Why Jev Cannot Hallucinate",
     "Jev vs LLM",
     "Where Jev Works Well and Where It Fails",
     "When to Use Which One"
    ]
   }
  ]
 },
 {
  "id": "training-alignment",
  "number": 8,
  "title": "Teaching and Shaping Models",
  "short": "Training & Alignment",
  "icon": "⟲",
  "accent": "#c4f0b4",
  "stage": "Adapt",
  "intro": [
   "In this module, we will learn how a pre-trained model is adapted to our own task, how it is made smaller, and how it is taught to follow instructions and human preferences.",
   "By the end of this module, we will know when to fine-tune, how LoRA makes it cheap, and how RLHF, PPO, DPO, and GRPO align a model."
  ],
  "lessons": [
   {
    "id": "how-does-fine-tuning-work",
    "num": "8.1",
    "title": "Fine-Tuning: Adapting a Pre-Trained Model to Your Task",
    "source": "",
    "covers": [
     "What is Fine-tuning?",
     "Why do we need Fine-tuning?",
     "How does Fine-tuning work step by step?",
     "A simple worked example with numbers",
     "Full Fine-tuning vs LoRA",
     "When to use Fine-tuning",
     "Tips before we Fine-tune",
     "Summary"
    ]
   },
   {
    "id": "lora-low-rank-adaptation-of-llms",
    "num": "8.2",
    "title": "LoRA: Parameter-Efficient Fine-Tuning via Low-Rank Matrices",
    "source": "",
    "covers": [
     "The Big Picture",
     "Why Full Fine-Tuning Is Expensive",
     "The Core Idea Behind LoRA",
     "How LoRA Works Step by Step",
     "A Small Numeric Example",
     "Where LoRA Is Applied in a Transformer",
     "Merging LoRA Back Into the Model",
     "Real-World Use Cases",
     "Quick Summary"
    ]
   },
   {
    "id": "how-does-prefix-tuning-work",
    "num": "8.3",
    "title": "Prefix Tuning: Learnable Context Prepended to the Input",
    "source": "",
    "covers": [
     "What is a large language model?",
     "The problem: why full fine-tuning is expensive",
     "What is Prefix Tuning?",
     "Prefix Tuning = Prefix + Tuning",
     "How does Prefix Tuning work?",
     "The prefix is not real words",
     "Where the prefix is added",
     "How the prefix is trained",
     "How small is the prefix really?",
     "A simple code example",
     "Prefix Tuning vs Full Fine-Tuning",
     "Prefix Tuning vs Prompt Tuning",
     "Advantages of Prefix Tuning",
     "Limitations of Prefix Tuning",
     "Where Prefix Tuning is used"
    ]
   },
   {
    "id": "how-does-knowledge-distillation-work",
    "num": "8.4",
    "title": "Knowledge Distillation: Compressing Large Models into Small Ones",
    "source": "",
    "covers": [
     "What is Knowledge Distillation?",
     "Why we need Knowledge Distillation",
     "Hard labels vs soft labels",
     "Dark knowledge",
     "Temperature in the softmax",
     "The distillation loss",
     "A step-by-step training walkthrough",
     "Types of Knowledge Distillation",
     "Real examples of Knowledge Distillation",
     "Wrapping up Knowledge Distillation"
    ]
   },
   {
    "id": "continual-learning-in-llms",
    "num": "8.5",
    "title": "Continual Learning: Training Without Forgetting the Past",
    "source": "",
    "covers": [
     "What is Continual Learning?",
     "Why do we need Continual Learning in LLMs?",
     "The big problem: Catastrophic Forgetting",
     "Approaches to Continual Learning in LLMs",
     "Challenges in Continual Learning",
     "Real-world use cases"
    ]
   },
   {
    "id": "decoding-deep-rl-from-human-preferences",
    "num": "8.6",
    "title": "Deep RL from Human Preferences: The Foundational Paper",
    "source": "",
    "covers": [
     "The building blocks we must know first",
     "The big picture: what the paper does",
     "Why it was needed: the reward problem",
     "Trajectory segments, or clips",
     "The human comparison",
     "The reward model and the preference math",
     "Training the reward model",
     "Training the agent with reinforcement learning",
     "The loop and the smart bits",
     "The results: the backflip and beyond",
     "The legacy: this is RLHF",
     "What this looks like today",
     "Quick Summary"
    ]
   },
   {
    "id": "decoding-instructgpt",
    "num": "8.7",
    "title": "InstructGPT: Teaching GPT-3 to Follow Instructions",
    "source": "",
    "covers": [
     "What is the InstructGPT paper?",
     "The building blocks we must know first",
     "The big picture: what InstructGPT does",
     "Why GPT-3 was not enough",
     "Helpful, Honest, and Harmless",
     "The three-step method",
     "Step 1: Supervised Fine-Tuning",
     "Step 2: The Reward Model",
     "Step 3: Reinforcement Learning with PPO",
     "The alignment tax",
     "The results",
     "What alignment looks like today",
     "Quick Summary"
    ]
   },
   {
    "id": "reinforcement-learning-from-human-feedback-rlhf",
    "num": "8.8",
    "title": "RLHF: Aligning LLMs with Human Preferences",
    "source": "",
    "covers": [
     "What is RLHF",
     "Why we need RLHF",
     "The Big Picture",
     "Stage 1: Supervised Fine-Tuning (SFT)",
     "Stage 2: Training the Reward Model",
     "Stage 3: RL Fine-Tuning with PPO",
     "The KL Penalty",
     "Putting It All Together",
     "Reward Hacking",
     "Common Mistakes",
     "Best Practices",
     "Quick Summary"
    ]
   },
   {
    "id": "proximal-policy-optimization-ppo",
    "num": "8.9",
    "title": "PPO: The Reinforcement Algorithm Behind Instruction Tuning",
    "source": "",
    "covers": [
     "What is Reinforcement Learning?",
     "What is a Policy?",
     "The problem with simple policy updates.",
     "What is Proximal Policy Optimization (PPO)?",
     "The key idea behind PPO: Clipping.",
     "The PPO objective function in simple words.",
     "How PPO works step-by-step.",
     "PPO in Large Language Models (RLHF).",
     "Advantages of PPO.",
     "Disadvantages of PPO."
    ]
   },
   {
    "id": "direct-preference-optimization-dpo",
    "num": "8.10",
    "title": "DPO: Alignment Without the Separate Reward Model",
    "source": "",
    "covers": [
     "What is RLHF and why do we need it?",
     "The problem with RLHF.",
     "What is Direct Preference Optimization (DPO)?",
     "What is preference data?",
     "The key idea behind DPO.",
     "The DPO loss function in simple words.",
     "How DPO works step-by-step.",
     "DPO vs RLHF (PPO).",
     "Advantages of DPO.",
     "Disadvantages of DPO."
    ]
   },
   {
    "id": "group-relative-policy-optimization-grpo",
    "num": "8.11",
    "title": "GRPO: Group-Based Preference Optimization Explained",
    "source": "",
    "covers": [
     "What is GRPO?",
     "Why do we need GRPO?",
     "The problem with PPO.",
     "How does GRPO work?",
     "Step-by-step example.",
     "The GRPO objective in simple words.",
     "Advantages of GRPO.",
     "Practical things to keep in mind.",
     "When to use GRPO.",
     "Conclusion."
    ]
   }
  ]
 },
 {
  "id": "prompt-context",
  "number": 9,
  "title": "The Art of Prompting",
  "short": "Prompt Engineering",
  "icon": "❝",
  "accent": "#ffd0b8",
  "stage": "Build",
  "intro": [
   "In this module, we will learn how to talk to an LLM so that it gives better answers, and how to manage everything that goes into its context window.",
   "By the end of this module, we will be able to design prompts and contexts that make an LLM reliable, fast, and cheap."
  ],
  "lessons": [
   {
    "id": "how-does-chain-of-thought-prompting-work",
    "num": "9.1",
    "title": "Chain-of-Thought Prompting: Making Models Reason Step by Step",
    "source": "",
    "covers": [
     "What is a prompt?",
     "What is an LLM?",
     "The problem: when the model jumps straight to the answer",
     "What is Chain-of-Thought (CoT) Prompting?",
     "A simple example without CoT and with CoT",
     "Zero-shot CoT vs Few-shot CoT",
     "A step-by-step walkthrough of a reasoning chain",
     "Why does Chain-of-Thought Prompting work?",
     "Where Chain-of-Thought Prompting is useful",
     "Things to keep in mind"
    ]
   },
   {
    "id": "how-does-prompt-chaining-work",
    "num": "9.2",
    "title": "Prompt Chaining: Decomposing Complex Tasks into Steps",
    "source": "",
    "covers": [
     "What is a prompt?",
     "What is Prompt Chaining?",
     "Why do we need Prompt Chaining?",
     "How does Prompt Chaining work step by step?",
     "A real example of Prompt Chaining",
     "Code example of Prompt Chaining",
     "Common patterns in Prompt Chaining",
     "Advantages of Prompt Chaining",
     "Things to take care of while using Prompt Chaining",
     "When to use Prompt Chaining"
    ]
   },
   {
    "id": "how-does-prompt-caching-work",
    "num": "9.3",
    "title": "Prompt Caching: Reusing Computation Across API Calls",
    "source": "",
    "covers": [
     "What is a prompt",
     "A quick recap of how an LLM reads a prompt",
     "What is Prompt Caching",
     "Why we need Prompt Caching",
     "The core idea behind Prompt Caching",
     "The exact-prefix rule",
     "Cache write vs cache read and TTL",
     "What we should put in the cache",
     "The benefits of Prompt Caching",
     "Prompt Caching in the real world"
    ]
   },
   {
    "id": "context-engineering",
    "num": "9.4",
    "title": "Context Engineering: Curating the Model's Working Memory",
    "source": "",
    "covers": [
     "What is Context Engineering?",
     "The Big Picture",
     "Why Context Engineering matters",
     "Prompt Engineering vs Context Engineering",
     "The components of the context",
     "Common patterns in Context Engineering",
     "Common mistakes to avoid",
     "Best practices",
     "Quick Summary"
    ]
   },
   {
    "id": "how-does-context-compaction-work",
    "num": "9.5",
    "title": "Context Compaction: Fitting More Into a Finite Window",
    "source": "",
    "covers": [
     "What is a Large Language Model",
     "What is the context window",
     "What is context",
     "The problem of long conversations",
     "The naive fix and why it fails",
     "What is context compaction",
     "How summarization powers compaction",
     "A step-by-step walkthrough",
     "Context compaction in code",
     "Compaction in real AI agents",
     "Why context compaction is important"
    ]
   }
  ]
 },
 {
  "id": "rag",
  "number": 10,
  "title": "Building RAG Systems",
  "short": "RAG Systems",
  "icon": "⌕",
  "accent": "#b4e4ff",
  "stage": "Build",
  "intro": [
   "In this module, we will learn how to give an LLM knowledge that it was never trained on. We will start with how vectors are stored and searched, then move to retrieval techniques, and finally to the advanced forms of RAG.",
   "By the end of this module, we will be able to build a production-grade RAG pipeline and pick the right retrieval technique for our data."
  ],
  "lessons": [
   {
    "id": "how-does-a-vector-database-work",
    "num": "10.1",
    "title": "Vector Databases: Storing and Searching Embeddings at Scale",
    "source": "",
    "covers": [
     "What is a Vector Database?",
     "A quick recap of embeddings",
     "Why normal databases fall short",
     "What a Vector Database actually stores",
     "How do we measure similarity?",
     "Cosine similarity",
     "Dot product",
     "Euclidean distance",
     "The nearest neighbour problem",
     "Why brute force is too slow",
     "Approximate Nearest Neighbour (ANN) and indexing",
     "HNSW explained simply",
     "IVF explained simply",
     "PQ explained simply",
     "A small code example",
     "Real-world applications of Vector Databases"
    ]
   },
   {
    "id": "how-does-approximate-nearest-neighbor-ann-search-work",
    "num": "10.2",
    "title": "ANN Search: Finding Similar Vectors Without Brute Force",
    "source": "",
    "covers": [
     "What is Nearest Neighbor Search?",
     "How do we turn things into numbers (vectors)?",
     "How do we measure \"closeness\"?",
     "The naive approach and why it fails",
     "What is Approximate Nearest Neighbor (ANN) Search?",
     "The trade-off: speed vs accuracy",
     "Approach 1: Trees (KD-Tree)",
     "Approach 2: Hashing (LSH)",
     "Approach 3: Clustering (IVF)",
     "Approach 4: Graphs (HNSW)",
     "A simple code example",
     "Where ANN Search is used",
     "Picking the right method"
    ]
   },
   {
    "id": "how-does-semantic-search-work",
    "num": "10.3",
    "title": "Semantic Search: Finding Meaning, Not Just Keywords",
    "source": "",
    "covers": [
     "What is keyword search",
     "Where keyword search fails",
     "What is Semantic Search",
     "What is an embedding",
     "How similar meanings sit close together",
     "How we measure closeness with cosine similarity",
     "What is a vector database",
     "The full Semantic Search flow",
     "Approximate nearest neighbor for speed at scale",
     "Semantic Search in the real world"
    ]
   },
   {
    "id": "how-does-hybrid-search-work",
    "num": "10.4",
    "title": "Hybrid Search: Combining Sparse and Dense Retrieval",
    "source": "",
    "covers": [
     "What is keyword search",
     "Why keyword search alone is not enough",
     "What is semantic search",
     "Why semantic search alone is not enough",
     "What is Hybrid Search",
     "How Hybrid Search runs both searches",
     "How the two result lists are combined",
     "Reciprocal Rank Fusion (RRF)",
     "Weighted score combination and normalization",
     "Hybrid Search in the real world"
    ]
   },
   {
    "id": "how-does-a-reranker-work",
    "num": "10.5",
    "title": "Rerankers: Re-Scoring Retrieved Results by Relevance",
    "source": "",
    "covers": [
     "What is a Reranker",
     "Where a Reranker sits in a search / RAG pipeline",
     "The two-stage retrieval idea",
     "Why first-stage retrieval is fast but not precise",
     "Bi-encoder vs Cross-encoder",
     "How a Reranker scores documents step by step",
     "The accuracy vs latency and cost trade-off",
     "Late-interaction models like ColBERT",
     "Real examples of Rerankers",
     "Why Rerankers matter for RAG"
    ]
   },
   {
    "id": "decoding-colbert",
    "num": "10.6",
    "title": "ColBERT: Token-Level Late Interaction for Retrieval",
    "source": "",
    "covers": [
     "What is the ColBERT paper?",
     "The building blocks we must know first",
     "The big picture: what ColBERT does",
     "The two old extremes",
     "Late interaction: the key idea",
     "Encoding the query and document",
     "The MaxSim operation",
     "Why max, not average",
     "Ranking documents",
     "Training: positives and negatives",
     "The loss with small numbers",
     "Fast retrieval at scale",
     "The cost of a bigger index",
     "The Results",
     "Where ColBERT led",
     "Quick Summary"
    ]
   },
   {
    "id": "chunking-strategies-for-rag",
    "num": "10.7",
    "title": "Document Chunking Strategies for RAG",
    "source": "",
    "covers": [
     "What is RAG?",
     "What is a chunk?",
     "Why do we need chunking?",
     "How retrieval actually works",
     "What happens when we chunk badly",
     "Fixed-size chunking",
     "Chunking by sentence",
     "Recursive chunking",
     "Document structure based chunking",
     "Semantic chunking",
     "Contextual chunking",
     "Small-to-big chunking",
     "Agentic chunking",
     "Chunk overlap",
     "How to choose the chunk size",
     "Comparison of all the strategies",
     "Common mistakes",
     "Conclusion"
    ]
   },
   {
    "id": "how-does-hyde-work",
    "num": "10.8",
    "title": "HyDE: Generating Hypothetical Documents to Improve RAG",
    "source": "",
    "covers": [
     "What is RAG in simple words",
     "What is the search problem in RAG",
     "Why searching with the question is weak",
     "What is HyDE",
     "Why searching with a fake answer works better",
     "How HyDE works step by step",
     "A worked example of HyDE",
     "A simple code example of HyDE",
     "Advantages of HyDE",
     "Disadvantages of HyDE",
     "When to use HyDE",
     "Summary"
    ]
   },
   {
    "id": "how-does-an-embedding-cache-work",
    "num": "10.9",
    "title": "Embedding Caches: Avoiding Redundant Embedding Calls",
    "source": "",
    "covers": [
     "What is an embedding",
     "A quick recap of how we get an embedding",
     "What is an Embedding Cache",
     "Why we need an Embedding Cache",
     "The core idea behind an Embedding Cache",
     "The cache key, a hash of the text plus the model",
     "The request flow, a hit and a miss",
     "Eviction, LRU and TTL",
     "Where the cache lives, memory or disk",
     "The benefits of an Embedding Cache",
     "An Embedding Cache in the real world"
    ]
   },
   {
    "id": "how-does-semantic-caching-work",
    "num": "10.10",
    "title": "Semantic Caching: Skipping the LLM for Similar Queries",
    "source": "",
    "covers": [
     "What is a cache?",
     "The problem with traditional caching for AI apps",
     "What is Semantic Caching?",
     "What are embeddings?",
     "What is similarity between embeddings?",
     "How does Semantic Caching work step by step?",
     "A numeric walkthrough",
     "Setting the similarity threshold",
     "Advantages of Semantic Caching",
     "Things to keep in mind"
    ]
   },
   {
    "id": "agentic-rag",
    "num": "10.11",
    "title": "Agentic RAG: Dynamic Retrieval with Multi-Step Reasoning",
    "source": "",
    "covers": [
     "The Big Picture",
     "A Quick Recap of RAG",
     "A Quick Recap of AI Agent",
     "Why Standard RAG Falls Short",
     "What is Agentic RAG",
     "The Agentic RAG Loop",
     "The Three Building Blocks",
     "A Walkthrough with a Real Example",
     "Common Patterns of Agentic RAG",
     "Standard RAG vs Agentic RAG",
     "When to Use Agentic RAG",
     "Limitations of Agentic RAG",
     "Quick Summary"
    ]
   },
   {
    "id": "graphrag",
    "num": "10.12",
    "title": "GraphRAG: Combining Knowledge Graphs with Retrieval",
    "source": "",
    "covers": [
     "What is GraphRAG?",
     "Why normal RAG is not enough",
     "The big picture of GraphRAG",
     "How GraphRAG builds the knowledge graph",
     "How GraphRAG answers a question",
     "Local search vs Global search",
     "When to use GraphRAG",
     "Trade-offs of GraphRAG",
     "Quick Summary"
    ]
   },
   {
    "id": "vectorless-rag",
    "num": "10.13",
    "title": "Vectorless RAG: Retrieval Without Embeddings or a Vector Store",
    "source": "",
    "covers": [
     "What is an LLM",
     "What is RAG",
     "How the normal Vector RAG works",
     "Problems with Vector RAG",
     "What is Vectorless RAG",
     "How Vectorless RAG works",
     "An example of Vectorless RAG",
     "Other Vectorless approaches",
     "Advantages of Vectorless RAG",
     "Disadvantages of Vectorless RAG",
     "Vector RAG vs Vectorless RAG",
     "When to use which one",
     "[AI Engineering Explained: LLM, RAG, MCP, Agent, Fine-Tuning, Quantization](https://www.youtube.com/watch?v=lnfWvX66FUk) (Video)",
     "[Agentic RAG Explained](https://www.youtube.com/watch?v=6nSegpuWJVw) (Video)"
    ]
   }
  ]
 },
 {
  "id": "agents",
  "number": 11,
  "title": "Autonomous AI Agents",
  "short": "AI Agents",
  "icon": "⚙",
  "accent": "#e0c4ff",
  "stage": "Build",
  "intro": [
   "In this module, we will learn how an LLM goes from answering questions to actually doing work. We will start with a single agent, see how it uses tools and memory, and then move to systems where many agents work together.",
   "By the end of this module, we will be able to design a single agent, give it tools and memory, and scale it to a multi-agent system."
  ],
  "lessons": [
   {
    "id": "ai-agent",
    "num": "11.1",
    "title": "AI Agents: Autonomous Decision-Making Systems",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is an AI Agent",
     "AI Agent vs Plain LLM vs Chatbot",
     "The Five Core Parts",
     "How an AI Agent Works End to End",
     "A Concrete Example: Research Agent",
     "Types of AI Agents",
     "What AI Agents Can Do Today",
     "When to Use an AI Agent",
     "Common Failure Modes",
     "Quick Summary"
    ]
   },
   {
    "id": "how-does-function-calling-work-in-llms",
    "num": "11.2",
    "title": "Function Calling: Giving LLMs Tools to Act on the World",
    "source": "",
    "covers": [
     "What is Function Calling",
     "Why We Need Function Calling",
     "The Key Insight: The Model Does Not Run the Function",
     "How Function Calling Works Step by Step",
     "A Concrete Example: get_weather(city)",
     "The Conversation Loop",
     "Multi-Step and Parallel Function Calling",
     "Relation to Structured Outputs and JSON Mode",
     "Real-World Use: The Backbone of AI Agents",
     "Quick Summary"
    ]
   },
   {
    "id": "ai-agent-loop",
    "num": "11.3",
    "title": "The Agent Loop: Observe, Think, Act, Repeat",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is the AI Agent Loop",
     "Why an AI Agent Needs a Loop",
     "The Think-Act-Observe Cycle",
     "The Loop Step by Step",
     "The Loop in Real Code",
     "Parallel Tool Calls in One Turn",
     "How the Loop Knows When to Stop",
     "Common Loop Failures",
     "Quick Summary"
    ]
   },
   {
    "id": "react-agent",
    "num": "11.4",
    "title": "ReAct Agents: Interleaving Reasoning and Acting",
    "source": "",
    "covers": [
     "What is a ReAct Agent",
     "ReAct Agent vs AI Agent",
     "Anatomy of a ReAct Agent",
     "The ReAct Prompt Template",
     "How a ReAct Agent Thinks and Acts",
     "A Full Trace Example",
     "Implementing a ReAct Agent",
     "Common Failure Modes and How to Fix Them",
     "Quick Summary"
    ]
   },
   {
    "id": "plan-and-execute-agent",
    "num": "11.5",
    "title": "Plan-and-Execute: Tackling Complex Tasks in Two Phases",
    "source": "",
    "covers": [
     "What is a Plan-and-Execute Agent",
     "Plan-and-Execute Agent vs AI Agent",
     "Anatomy of a Plan-and-Execute Agent",
     "How a Plan-and-Execute Agent Works",
     "A Full Trace Example",
     "Plan-and-Execute Agent vs ReAct Agent",
     "Common Failure Modes and How to Fix Them",
     "Quick Summary"
    ]
   },
   {
    "id": "reflection-agent",
    "num": "11.6",
    "title": "Reflection Agents: Self-Critique for Higher-Quality Outputs",
    "source": "",
    "covers": [
     "What is a Reflection Agent",
     "Reflection Agent vs AI Agent",
     "Anatomy of a Reflection Agent",
     "How a Reflection Agent Works",
     "A Full Trace Example",
     "Reflection Agent vs ReAct Agent",
     "Common Failure Modes and How to Fix Them",
     "Quick Summary"
    ]
   },
   {
    "id": "ai-agent-memory",
    "num": "11.7",
    "title": "Agent Memory: Short-Term, Long-Term, and Episodic",
    "source": "",
    "covers": [
     "The Big Picture",
     "Why AI Agents Need Memory",
     "The Memory Stack",
     "The Four Core Operations",
     "How Memory Flows at Runtime",
     "What to Store and What Not to Store",
     "Common Mistakes and How to Fix Them",
     "Quick Summary"
    ]
   },
   {
    "id": "what-is-mcp-model-context-protocol",
    "num": "11.8",
    "title": "Model Context Protocol: A Standard Interface for Agent Tools",
    "source": "",
    "covers": [
     "The problem before MCP",
     "What is MCP?",
     "MCP = Model + Context + Protocol",
     "The USB-C analogy",
     "How it is different from a normal API",
     "The three parts of MCP",
     "How it all works step by step",
     "How the connection happens",
     "A real example",
     "Importance of MCP",
     "Things we must be careful about",
     "Summary"
    ]
   },
   {
    "id": "what-are-agent-skills",
    "num": "11.9",
    "title": "Agent Skills: Reusable Capabilities in Agentic Systems",
    "source": "",
    "covers": [
     "The problem before Agent Skills",
     "What are Agent Skills?",
     "What is inside a Skill?",
     "The description is the trigger",
     "Progressive disclosure, the main idea",
     "A Skill can carry real code",
     "Where Skills live",
     "How do we create our own Skill?",
     "Agent Skills vs MCP",
     "A real example",
     "Importance of Agent Skills",
     "Things we must be careful about",
     "Summary"
    ]
   },
   {
    "id": "what-is-okf-open-knowledge-format",
    "num": "11.10",
    "title": "Open Knowledge Format: Structured Agent-to-Agent Communication",
    "source": "",
    "covers": [
     "The problem: our knowledge is scattered",
     "What is OKF?",
     "OKF = Open + Knowledge + Format",
     "What is inside an OKF bundle?",
     "The frontmatter and the one required field",
     "Cross-links turn files into a graph",
     "Why plain markdown files?",
     "How an agent actually uses it",
     "OKF, MCP, and Agent Skills",
     "What ships with OKF today",
     "Summary"
    ]
   },
   {
    "id": "multi-agent-systems",
    "num": "11.11",
    "title": "Multi-Agent Systems: Dividing Work Among Specialist Agents",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is a Multi-Agent System",
     "The Three Pillars",
     "Common Agent Roles",
     "How Agents Communicate",
     "How Agents Coordinate",
     "Multi-Agent vs Single Agent - The Trade-offs",
     "Common Mistakes",
     "When to Use a Multi-Agent System",
     "Quick Summary"
    ]
   },
   {
    "id": "ai-subagents",
    "num": "11.12",
    "title": "Subagents: Delegating Tasks Within an Agent Network",
    "source": "",
    "covers": [
     "What is an AI Agent?",
     "What are AI SubAgents?",
     "Why do we need SubAgents?",
     "How do SubAgents work?",
     "Example use case",
     "Benefits of using SubAgents",
     "Challenges with SubAgents",
     "Best practices"
    ]
   },
   {
    "id": "how-ai-agents-communicate",
    "num": "11.13",
    "title": "Agent Communication: Protocols and Message Formats",
    "source": "",
    "covers": [
     "What is agent communication?",
     "Why do agents need to communicate?",
     "What agents need in order to communicate",
     "How a message flows between agents",
     "The ways AI agents communicate",
     "Direct Communication",
     "Centralized Communication",
     "Broadcast Communication",
     "Shared Memory Communication",
     "What a message looks like",
     "The rules agents follow to talk",
     "Challenges when agents communicate",
     "Best Practices"
    ]
   },
   {
    "id": "ai-orchestration",
    "num": "11.14",
    "title": "AI Orchestration: Coordinating Agents, Tools, and Flows",
    "source": "",
    "covers": [
     "What is AI Orchestration?",
     "Why do we need AI Orchestration?",
     "AI Orchestration vs AI Agents",
     "Components of AI Orchestration",
     "How AI Orchestration works",
     "Patterns of AI Orchestration",
     "Sequential Pattern",
     "Parallel Pattern",
     "Conditional Pattern",
     "Loop Pattern",
     "Orchestrator-Worker Pattern",
     "Tools for AI Orchestration",
     "Challenges in AI Orchestration",
     "Best Practices"
    ]
   },
   {
    "id": "decoding-sakana-fugu",
    "num": "11.15",
    "title": "Sakana Fugu: Lessons from an Open-Source Agent Study",
    "source": "",
    "covers": [
     "What is Sakana Fugu?",
     "Why Fugu was needed",
     "The big picture: what Fugu does",
     "Collective Intelligence",
     "The two Fugus - Fugu and Fugu-Ultra",
     "How Fugu picks the right model - the lightweight selection head",
     "Teaching Fugu who is best - supervised fine-tuning",
     "Polishing Fugu on real tasks - evolutionary strategies",
     "How Fugu-Ultra conducts an orchestra - the Conductor",
     "Teaching Fugu-Ultra to conduct - GRPO",
     "Stopping the agents from copying each other",
     "How well does Fugu perform?",
     "The clever strategies Fugu discovered on its own",
     "Quick Summary"
    ]
   },
   {
    "id": "how-do-computer-use-agents-work",
    "num": "11.16",
    "title": "Computer-Use Agents: Controlling Interfaces with AI",
    "source": "",
    "covers": [
     "What is a computer-use agent?",
     "Why do we need a computer-use agent?",
     "The perceive, think, act loop",
     "How does the agent see the screen?",
     "How does the agent decide what to do?",
     "How does the agent take actions?",
     "A step-by-step walkthrough with an example",
     "The system prompt and tools",
     "Safety and guardrails",
     "Limitations of computer-use agents",
     "Conclusion"
    ]
   }
  ]
 },
 {
  "id": "agentic-engineering",
  "number": 12,
  "title": "Agent Patterns and Frameworks",
  "short": "Agent Frameworks",
  "icon": "⌘",
  "accent": "#c8d4ff",
  "stage": "Build",
  "intro": [
   "In this module, we will learn the engineering practices for building reliable agents, and then see how the popular frameworks and coding agents are built.",
   "By the end of this module, we will know how to engineer the harness, the loop, and the graph around an agent, and how real coding agents work under the hood."
  ],
  "lessons": [
   {
    "id": "harness-engineering-in-ai",
    "num": "12.1",
    "title": "Harness Engineering: The Scaffolding Around AI Agents",
    "source": "",
    "covers": [
     "What is a Harness in AI?",
     "Why do we need Harness Engineering?",
     "Components of an AI Harness",
     "Harness Engineering for AI Agents",
     "Harness Engineering for Evaluation",
     "Best Practices in Harness Engineering",
     "Putting It All Together"
    ]
   },
   {
    "id": "what-is-loop-engineering",
    "num": "12.2",
    "title": "Loop Engineering: Designing Reliable Agentic Loops",
    "source": "",
    "covers": [
     "What is Loop Engineering?",
     "Loop Engineering = Loop + Engineering",
     "Why do we need Loop Engineering?",
     "What is a loop in an AI agent?",
     "The simplest loop and its problems",
     "The parts of the loop that we must engineer",
     "Prompt Engineering vs Context Engineering vs Loop Engineering",
     "Common ways a loop breaks",
     "Techniques of Loop Engineering",
     "A complete example",
     "Where it works well and where it fails"
    ]
   },
   {
    "id": "what-is-graph-engineering",
    "num": "12.3",
    "title": "Graph Engineering: Stateful Workflows for Agents",
    "source": "",
    "covers": [
     "What is Graph Engineering?",
     "Graph = Nodes + Edges",
     "Why do we need Graph Engineering?",
     "The three building blocks: Node, Edge, and State",
     "Let's build our first graph",
     "Conditional edges: taking decisions inside the graph",
     "Cycles: doing the work again when needed",
     "One full run, step by step",
     "Parallel branches: doing many things at the same time",
     "Checkpoints: pause and resume the graph",
     "Human in the loop",
     "Handling errors inside a graph",
     "Graph Engineering vs Loop Engineering",
     "Where Graph Engineering works well",
     "Where Graph Engineering fails",
     "Best practices in Graph Engineering",
     "Conclusion"
    ]
   },
   {
    "id": "ai-is-only-as-good-as-our-definition-of-done",
    "num": "12.4",
    "title": "Defining Done: Why Exit Criteria Shape Agent Quality",
    "source": "",
    "covers": [
     "What is a definition of done",
     "Tasks where the definition of done is exact",
     "Tasks where the definition of done is fuzzy",
     "Why AI is so strong exactly where we can measure",
     "How to write a better definition of done"
    ]
   },
   {
    "id": "how-does-langchain-work",
    "num": "12.5",
    "title": "LangChain: Composable Components for LLM Applications",
    "source": "",
    "covers": [
     "What is LangChain?",
     "Why do we need LangChain?",
     "The core idea behind LangChain",
     "LLM and Prompt Template",
     "What is a Chain?",
     "Output Parser",
     "Memory",
     "Retrieval and RAG",
     "Tools and Agents",
     "A complete flow of how LangChain works"
    ]
   },
   {
    "id": "how-does-langgraph-work",
    "num": "12.6",
    "title": "LangGraph: Graph-Based Agent Orchestration Explained",
    "source": "",
    "covers": [
     "What is LangGraph?",
     "Why do we need LangGraph?",
     "What is a Graph in LangGraph?",
     "What is State in LangGraph?",
     "Nodes and Edges",
     "Conditional Edges",
     "A complete example",
     "Tools and who calls them",
     "Memory and persistence",
     "Human-in-the-loop",
     "When to use LangGraph"
    ]
   },
   {
    "id": "how-does-claude-code-work",
    "num": "12.7",
    "title": "Claude Code: AI-Powered Software Engineering at the CLI",
    "source": "",
    "covers": [
     "What is Claude Code?",
     "The problem with a normal AI chatbot",
     "The agent loop",
     "The tools of Claude Code",
     "Example: Claude Code fixing a bug",
     "How does Claude Code search a big project?",
     "How does Claude Code verify its own work?",
     "CLAUDE.md: The project memory",
     "Permissions: How we stay in control",
     "Plan mode, subagents, and hooks",
     "Putting it all together"
    ]
   },
   {
    "id": "how-does-cursor-work",
    "num": "12.8",
    "title": "Cursor: Inside an AI-Native Code Editor",
    "source": "",
    "covers": [
     "What is Cursor?",
     "Cursor = Code Editor + AI",
     "The big idea behind Cursor",
     "How does Cursor understand our code?",
     "How does Cursor index our codebase?",
     "How does Tab autocomplete work?",
     "How does the Chat work?",
     "How does the Agent mode work?",
     "How does Cursor apply the changes?",
     "Why does Cursor use different models?",
     "How does Cursor keep our code private?",
     "The complete flow of Cursor"
    ]
   }
  ]
 },
 {
  "id": "inference",
  "number": 13,
  "title": "Serving LLMs at Scale",
  "short": "Inference Eng.",
  "icon": "⚡",
  "accent": "#ffe0a0",
  "stage": "Production",
  "intro": [
   "In this module, we will learn how to make LLMs faster and cheaper to run. We will start with what happens during inference, then learn the caching, batching, and speculation techniques, then quantization, and finally the serving engines that put it all together.",
   "By the end of this module, we will understand TTFT, TPOT, and throughput, and know which optimization fixes which bottleneck."
  ],
  "lessons": [
   {
    "id": "llm-inference-optimization",
    "num": "13.1",
    "title": "LLM Inference Optimization: The Full Landscape",
    "source": "",
    "covers": [
     "What is an LLM and how it writes text",
     "What is Attention",
     "What is the KV Cache",
     "Why the KV Cache becomes huge",
     "What is KV Cache Compression",
     "Approach 1: Quantization",
     "Approach 2: Token Eviction",
     "Approach 3: Sharing Keys and Values across Heads",
     "Approach 4: Low-Rank Compression",
     "Comparison of the approaches",
     "When to use which one"
    ]
   },
   {
    "id": "prefill-vs-decode-llm-inference-optimization",
    "num": "13.2",
    "title": "Prefill vs Decode: Two Distinct Phases of LLM Inference",
    "source": "",
    "covers": [
     "What is LLM inference",
     "The two phases: Prefill and Decode",
     "Prefill explained in simple words",
     "Decode explained in simple words",
     "A diagram of the two phases and the KV cache flow",
     "The KV cache as the bridge between the two phases",
     "A step-by-step walkthrough of a few decode steps",
     "Prefill vs Decode comparison table",
     "Why this split matters: compute-bound vs memory-bound",
     "The key metrics: TTFT, TPOT, throughput, and end-to-end latency",
     "Optimization techniques mapped to each phase",
     "Conclusion"
    ]
   },
   {
    "id": "prefill-decode-disaggregation",
    "num": "13.3",
    "title": "Prefill-Decode Disaggregation: Splitting the Two Phases",
    "source": "",
    "covers": [
     "How an LLM answers a request",
     "What is the KV Cache?",
     "Prefill is compute-heavy, Decode is memory-heavy",
     "The problem when both run on the same GPU",
     "TTFT vs TPOT",
     "The naive approaches and their issues",
     "What is Prefill-Decode Disaggregation?",
     "How Prefill-Decode Disaggregation works",
     "Walkthrough of one request",
     "Advantages of Prefill-Decode Disaggregation",
     "Disadvantages of Prefill-Decode Disaggregation",
     "Where it works well and where it is overkill",
     "Co-located vs Disaggregated serving"
    ]
   },
   {
    "id": "kv-cache-in-llms",
    "num": "13.4",
    "title": "The KV Cache: Avoiding Redundant Attention Computation",
    "source": "",
    "covers": [
     "How LLMs Generate Text",
     "What Happens Inside the Model",
     "The Problem: Repeated Computation",
     "The Solution: KV Cache",
     "Why Only Key and Value Are Cached, Not Query",
     "How Much Faster Does It Get",
     "The Trade-Off: Speed vs Memory"
    ]
   },
   {
    "id": "kv-cache-compression",
    "num": "13.5",
    "title": "KV Cache Compression: Trading Some Accuracy for Speed",
    "source": "",
    "covers": [
     "What is an LLM and how it writes text",
     "What is Attention",
     "What is the KV Cache",
     "Why the KV Cache becomes huge",
     "What is KV Cache Compression",
     "Approach 1: Quantization",
     "Approach 2: Token Eviction",
     "Approach 3: Sharing Keys and Values across Heads",
     "Approach 4: Low-Rank Compression",
     "Comparison of the approaches",
     "When to use which one"
    ]
   },
   {
    "id": "paged-attention-in-llms",
    "num": "13.6",
    "title": "Paged Attention: OS-Inspired Memory Management for KV Caches",
    "source": "",
    "covers": [
     "Quick Recap: KV Cache",
     "The Problem: Memory Waste in KV Cache",
     "What is Paged Attention?",
     "How Paged Attention Works",
     "Why Paged Attention Is So Effective",
     "Memory Sharing Across Requests"
    ]
   },
   {
    "id": "continuous-batching-in-llms",
    "num": "13.7",
    "title": "Continuous Batching: Keeping GPUs Busy Between Requests",
    "source": "",
    "covers": [
     "The Big Picture",
     "Quick Recap: How an LLM Generates Tokens",
     "Why Batching Matters for LLMs",
     "The Old Way: Static Batching",
     "The Problem with Static Batching",
     "What is Continuous Batching?",
     "The Ride-Share Analogy",
     "How Continuous Batching Works Step by Step",
     "A Numeric Example",
     "Real Numbers and Speedup",
     "Benefits of Continuous Batching",
     "A Few Important Notes",
     "Quick Summary"
    ]
   },
   {
    "id": "speculative-decoding",
    "num": "13.8",
    "title": "Speculative Decoding: Draft Fast, Verify in Parallel",
    "source": "",
    "covers": [
     "What problem does Speculative Decoding solve?",
     "The Big Picture",
     "Why is LLM generation slow?",
     "The core idea behind Speculative Decoding",
     "Step-by-step walkthrough",
     "The verification step",
     "Real numbers and speedup",
     "Where it is used",
     "Trade-offs",
     "Quick Summary"
    ]
   },
   {
    "id": "n-gram-speculation-in-llms",
    "num": "13.9",
    "title": "N-gram Speculation: Draft Tokens Without a Draft Model",
    "source": "",
    "covers": [
     "How an LLM generates text",
     "Why generating text is slow",
     "What is Speculative Decoding",
     "The cost of a draft model",
     "What is an N-gram",
     "What is N-gram Speculation",
     "N-gram Speculation step by step",
     "Why the output stays exactly the same",
     "Where it works well and where it fails",
     "N-gram Speculation vs Draft Model Speculative Decoding"
    ]
   },
   {
    "id": "decoding-medusa",
    "num": "13.10",
    "title": "Medusa: Parallel Decoding via Multiple Prediction Heads",
    "source": "",
    "covers": [
     "What is Medusa",
     "Why text generation is slow",
     "A quick recap of speculative decoding",
     "The problem with needing a draft model",
     "The big idea: many heads on one model",
     "How tree attention checks many guesses at once",
     "The math behind the speedup with small numbers",
     "The results",
     "How Medusa lives on today",
     "Quick Summary"
    ]
   },
   {
    "id": "decoding-eagle",
    "num": "13.11",
    "title": "EAGLE: Feature-Level Drafting for Faster Inference",
    "source": "",
    "covers": [
     "What is EAGLE",
     "A quick recap of speculative decoding",
     "The problem with token-level drafting",
     "The big idea: draft at the feature level",
     "Resolving the uncertainty by feeding back the token",
     "The math behind the speedup with small numbers",
     "EAGLE-2 and dynamic draft trees",
     "How EAGLE lives on today",
     "Quick Summary"
    ]
   },
   {
    "id": "how-does-model-quantization-work",
    "num": "13.12",
    "title": "Model Quantization: Shrinking Weights Without Breaking Outputs",
    "source": "",
    "covers": [
     "What is Model Quantization?",
     "How numbers use bits (FP32, INT8, INT4)",
     "Why fewer bits means less memory and faster speed",
     "The core mechanic: scale and zero-point",
     "Symmetric vs Asymmetric Quantization",
     "Per-tensor vs Per-channel Quantization",
     "Post-Training Quantization (PTQ) vs Quantization-Aware Training (QAT)",
     "Weight-only vs Weight-and-activation Quantization",
     "The outlier problem in LLMs",
     "Popular methods: GPTQ, AWQ, bitsandbytes, GGUF / llama.cpp",
     "The accuracy trade-off and running LLMs locally",
     "Wrapping up Model Quantization"
    ]
   },
   {
    "id": "how-does-gguf-work",
    "num": "13.13",
    "title": "GGUF: The File Format Powering Local LLM Inference",
    "source": "",
    "covers": [
     "What is a model and what are weights",
     "What is local inference",
     "The problem before GGUF",
     "What is GGUF",
     "What is stored inside a GGUF file",
     "What is quantization",
     "Understanding quantization names like Q4_K_M",
     "How GGUF loads fast with memory mapping",
     "Why GGUF is cross-platform and extensible",
     "GGUF in the real world"
    ]
   },
   {
    "id": "how-does-llama-cpp-run-llms-on-everyday-hardware",
    "num": "13.14",
    "title": "llama.cpp: Running Large Models on Consumer Hardware",
    "source": "",
    "covers": [
     "What is llama.cpp",
     "Why we needed llama.cpp",
     "A quick refresher on what an LLM is",
     "The real problem: models are too big to fit",
     "The first big idea: quantization",
     "Understanding names like Q4_K_M",
     "The GGUF file: everything packed in one box",
     "Memory mapping: loading the model the smart way",
     "Squeezing speed out of the CPU",
     "Sharing the work with the GPU",
     "The full journey of running a prompt",
     "Where llama.cpp is used"
    ]
   },
   {
    "id": "how-does-vllm-work",
    "num": "13.15",
    "title": "vLLM: High-Throughput Serving with PagedAttention",
    "source": "",
    "covers": [
     "What is serving an LLM",
     "A quick recap of prefill, decode, and the KV cache",
     "The problem: the KV cache eats GPU memory",
     "Why naive serving wastes memory",
     "What is vLLM",
     "PagedAttention, the core idea",
     "How PagedAttention shares memory",
     "Continuous batching",
     "The OpenAI-compatible API server",
     "The benefits of vLLM",
     "vLLM in the real world"
    ]
   },
   {
    "id": "how-does-sglang-work",
    "num": "13.16",
    "title": "SGLang: Structured LLM Programs for Efficient Inference",
    "source": "",
    "covers": [
     "What is SGLang",
     "A quick recap of how an LLM generates text",
     "The problem SGLang solves",
     "RadixAttention: the heart of SGLang",
     "How RadixAttention reuses past work",
     "The frontend language of SGLang",
     "How the runtime and the frontend work together",
     "Continuous batching in SGLang",
     "Structured output and faster decoding",
     "A simple end-to-end picture",
     "More powerful features of SGLang",
     "How SGLang compares to vLLM"
    ]
   },
   {
    "id": "how-does-tensorrt-llm-work",
    "num": "13.17",
    "title": "TensorRT-LLM: NVIDIA's Optimized Inference Engine",
    "source": "",
    "covers": [
     "What is inference",
     "What is a GPU and what is a kernel",
     "The problem: the GPU spends its time on the wrong things",
     "What is TensorRT-LLM",
     "The big idea: prepare the model ahead of time",
     "The build step: from a model to an engine",
     "Kernel fusion",
     "Quantization",
     "Custom attention kernels",
     "The paged KV cache",
     "In-flight batching",
     "CUDA graphs",
     "Speculative decoding",
     "Running one model across many GPUs",
     "How we actually serve the model",
     "The PyTorch backend, the newer and easier path",
     "The full journey of one request",
     "TensorRT-LLM vs vLLM",
     "Where it works well and where it fails",
     "[LLM Inference Optimization](https://www.youtube.com/watch?v=jV2sCj4lHYk) (Video)",
     "[The First-Token Latency Problem in LLMs](https://www.youtube.com/watch?v=XD8DD4cEHu0) (Video)",
     "The full LLM inference optimization pipeline, end to end"
    ]
   }
  ]
 },
 {
  "id": "evaluation",
  "number": 14,
  "title": "Measuring What Matters",
  "short": "Eval & Observability",
  "icon": "◉",
  "accent": "#b8f0dc",
  "stage": "Production",
  "intro": [
   "In this module, we will learn how to measure whether our LLM and our agent are actually doing a good job, and how to see what they are doing in production.",
   "By the end of this module, we will be able to build an evaluation suite and trace every step of an agent in production."
  ],
  "lessons": [
   {
    "id": "llm-evaluation",
    "num": "14.1",
    "title": "Evaluating LLMs: Metrics, Benchmarks, and Methods",
    "source": "",
    "covers": [
     "What is LLM Evaluation?",
     "Why do we need LLM Evaluation?",
     "Types of LLM Evaluation",
     "Automatic Metrics",
     "Benchmarks",
     "Human Evaluation",
     "LLM as a Judge",
     "Task-Specific Evaluation",
     "Safety and Red-Teaming Evaluation",
     "Challenges in LLM Evaluation",
     "Best Practices",
     "When to use which method"
    ]
   },
   {
    "id": "llm-as-a-judge",
    "num": "14.2",
    "title": "LLM-as-Judge: Automating Evaluation with Another Model",
    "source": "",
    "covers": [
     "What is LLM as a Judge?",
     "Why do we need LLM as a Judge?",
     "How does LLM as a Judge work?",
     "Types of LLM as a Judge.",
     "Steps to build an LLM Judge.",
     "A prompt template for LLM as a Judge.",
     "Chain-of-thought judging (G-Eval).",
     "Biases in LLM as a Judge.",
     "Best practices for LLM as a Judge.",
     "Real-world use cases of LLM as a Judge."
    ]
   },
   {
    "id": "ai-agent-evaluation",
    "num": "14.3",
    "title": "Evaluating AI Agents: Metrics and Methods That Work",
    "source": "",
    "covers": [
     "What is an AI Agent?",
     "What is AI Agent Evaluation?",
     "Why do we need AI Agent Evaluation?",
     "How is AI Agent Evaluation different from LLM Evaluation?",
     "Types of AI Agent Evaluation",
     "Outcome Evaluation",
     "Trajectory Evaluation",
     "Tool Use Evaluation",
     "Planning Evaluation",
     "Key Metrics for AI Agents",
     "Agent Benchmarks",
     "Methods to Evaluate AI Agents",
     "Frameworks and Tools for AI Agent Evaluation",
     "Challenges in AI Agent Evaluation",
     "Best Practices"
    ]
   },
   {
    "id": "ai-agent-observability",
    "num": "14.4",
    "title": "Agent Observability: Traces, Spans, and Debug Signals",
    "source": "",
    "covers": [
     "What is an AI Agent?",
     "What is Observability?",
     "What is AI Agent Observability?",
     "Why do we need AI Agent Observability?",
     "How is AI Agent Observability different from traditional Observability?",
     "The Three Pillars of Observability",
     "Traces and Spans",
     "What should we observe inside an AI Agent?",
     "Key Metrics for AI Agent Observability",
     "How AI Agent Observability works",
     "Tools and Frameworks for AI Agent Observability",
     "Observability vs Evaluation",
     "Challenges in AI Agent Observability",
     "Best Practices"
    ]
   }
  ]
 },
 {
  "id": "safety",
  "number": 15,
  "title": "Securing AI Systems",
  "short": "Safety & Security",
  "icon": "⛨",
  "accent": "#ffb8b8",
  "stage": "Production",
  "intro": [
   "In this module, we will learn how to keep an LLM application safe, how attackers try to break it, and how AI-generated text can be identified.",
   "By the end of this module, we will be able to defend an LLM application against the most common attacks."
  ],
  "lessons": [
   {
    "id": "how-do-llm-guardrails-work",
    "num": "15.1",
    "title": "LLM Guardrails: Filtering Inputs and Outputs for Safety",
    "source": "",
    "covers": [
     "What is an LLM",
     "What are LLM guardrails",
     "Why do we need guardrails",
     "Where guardrails sit: input and output",
     "Types of guardrails",
     "A simple input guardrail with code",
     "A simple output guardrail with code",
     "Using another model as a guardrail",
     "A step-by-step walkthrough of a request",
     "Limitations of guardrails",
     "Best practices for guardrails"
    ]
   },
   {
    "id": "prompt-injection-in-llms",
    "num": "15.2",
    "title": "Prompt Injection: Attacks Against LLM-Powered Systems",
    "source": "",
    "covers": [
     "What is a Large Language Model",
     "What is a prompt",
     "The system prompt and the user prompt",
     "What is Prompt Injection",
     "The root cause of Prompt Injection",
     "A simple example of Prompt Injection",
     "Direct Prompt Injection",
     "Indirect Prompt Injection",
     "A step-by-step walkthrough of a real attack",
     "A code example of how the attack sneaks in",
     "Prompt Injection vs Jailbreaking",
     "Why Prompt Injection is not like SQL Injection",
     "What an attacker can achieve",
     "The defenses, one approach at a time",
     "A defense checklist",
     "How to test our own application",
     "Why this problem is still not solved"
    ]
   },
   {
    "id": "how-does-llm-watermarking-work",
    "num": "15.3",
    "title": "LLM Watermarking: Embedding Invisible Signatures in AI Text",
    "source": "",
    "covers": [
     "What is a watermark?",
     "Why do we need a watermark in LLM-generated text?",
     "How does an LLM write text?",
     "How does an LLM choose the next word?",
     "The hidden freedom that makes watermarking possible",
     "Here comes the secret key into the picture",
     "Preferred tokens and other tokens",
     "Slightly changing the probabilities",
     "Why the preferred set keeps changing",
     "One token vs thousands of tokens",
     "How does the detection work?",
     "How is this different from an AI text detector?",
     "Why the quality of the text does not break",
     "What happens when someone edits the text?",
     "Where is LLM watermarking used in the real world?",
     "Advantages and disadvantages of LLM watermarking"
    ]
   }
  ]
 },
 {
  "id": "multimodal",
  "number": 16,
  "title": "Beyond Text: Multimodal AI",
  "short": "Multimodal AI",
  "icon": "◐",
  "accent": "#f0c4f0",
  "stage": "Frontier",
  "intro": [
   "In this module, we will learn how AI works with images and other types of data, and the generative models that create images from noise.",
   "By the end of this module, we will know how models see images and how they generate new ones."
  ],
  "lessons": [
   {
    "id": "multimodal-ai",
    "num": "16.1",
    "title": "Multimodal AI: Perceiving Text, Images, and Audio Together",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is a Modality?",
     "Unimodal AI vs Multimodal AI",
     "Why Multimodal AI?",
     "How Multimodal AI Works",
     "Three Common Types of Multimodal AI",
     "Real Examples of Multimodal AI",
     "Use Cases of Multimodal AI",
     "Common Mistakes to Avoid",
     "Quick Summary"
    ]
   },
   {
    "id": "decoding-vision-transformer-vit",
    "num": "16.2",
    "title": "Vision Transformers: Applying Self-Attention to Image Patches",
    "source": "",
    "covers": [
     "The Big Picture",
     "Decoding Step 1: Splitting the Image into Patches",
     "Decoding Step 2: Patch Embedding",
     "Decoding Step 3: The CLS Token",
     "Decoding Step 4: Position Embeddings",
     "Decoding Step 5: The Transformer Encoder",
     "Decoding Step 6: The Classification Head",
     "Putting It All Together",
     "ViT vs CNN",
     "Quick Summary"
    ]
   },
   {
    "id": "how-do-image-embeddings-work",
    "num": "16.3",
    "title": "Image Embeddings: Encoding Visual Content as Vectors",
    "source": "",
    "covers": [
     "What is an embedding?",
     "What is an image embedding?",
     "Why do we need image embeddings?",
     "How does a computer see an image?",
     "How are image embeddings created?",
     "A simple numeric walkthrough",
     "How do we measure similarity between two embeddings?",
     "A code example",
     "Where are image embeddings used?",
     "Summary"
    ]
   },
   {
    "id": "diffusion-models",
    "num": "16.4",
    "title": "Diffusion Models: Iterative Denoising to Generate Images",
    "source": "",
    "covers": [
     "What is a Diffusion Model?",
     "Why do we need Diffusion Models?",
     "The two processes: Forward and Reverse",
     "The Forward Process (adding noise)",
     "The Reverse Process (removing noise)",
     "A step-by-step example walk-through",
     "How the model is trained",
     "A simple code example",
     "Conditional Diffusion (text to image)",
     "Advantages of Diffusion Models",
     "Where Diffusion Models are used"
    ]
   },
   {
    "id": "generative-adversarial-networks",
    "num": "16.5",
    "title": "GANs: A Generator and Discriminator in Constant Competition",
    "source": "",
    "covers": [
     "What is a Generative Adversarial Network (GAN)?",
     "The two players: Generator vs Discriminator",
     "The counterfeiter vs police analogy",
     "The adversarial training loop",
     "The loss function and the minimax game in simple words",
     "A tiny PyTorch-style code sketch",
     "The mode collapse problem",
     "Training stability",
     "Types of GANs (DCGAN, Conditional GAN, StyleGAN, CycleGAN)",
     "Real-world applications of GANs"
    ]
   },
   {
    "id": "variational-autoencoders",
    "num": "16.6",
    "title": "Variational Autoencoders: Learning a Compressed Latent Space",
    "source": "",
    "covers": [
     "What is an Autoencoder?",
     "The problem with a normal Autoencoder",
     "What is a Variational Autoencoder?",
     "The encoder, the latent space, and the decoder",
     "The reparameterization trick",
     "The loss function of a Variational Autoencoder",
     "A simple example walk-through",
     "A simple code example",
     "Advantages of Variational Autoencoders",
     "Where Variational Autoencoders are used"
    ]
   }
  ]
 },
 {
  "id": "infrastructure",
  "number": 17,
  "title": "Production AI Infrastructure",
  "short": "AI Infrastructure",
  "icon": "▣",
  "accent": "#c4dcf0",
  "stage": "Production",
  "intro": [
   "In this module, we will learn the hardware that runs AI models, where to deploy a model, how to send each request to the right model, and how to design a complete AI system end to end.",
   "By the end of this module, we will be able to design an AI system end to end, from the hardware to the user."
  ],
  "lessons": [
   {
    "id": "how-does-a-gpu-work-for-deep-learning",
    "num": "17.1",
    "title": "GPUs for Deep Learning: Parallelism at the Core",
    "source": "",
    "covers": [
     "What is a GPU?",
     "Why is the GPU perfect for deep learning?",
     "CPU vs GPU",
     "The math professor and the thousands of students",
     "Why deep learning is mostly matrix multiplication",
     "Serial work vs parallel work",
     "GPU memory (VRAM) and memory bandwidth",
     "Why the model must fit in VRAM",
     "Tensor Cores and lower precision (FP16, BF16, INT8)",
     "CUDA and the software stack (cuDNN)",
     "Training vs inference on GPUs",
     "Multiple GPUs working together",
     "Why NVIDIA GPUs power modern AI"
    ]
   },
   {
    "id": "how-do-cuda-kernels-work",
    "num": "17.2",
    "title": "CUDA Kernels: Writing Parallel Code for NVIDIA GPUs",
    "source": "",
    "covers": [
     "Why do we need a GPU?",
     "What is CUDA?",
     "What is a CUDA Kernel?",
     "Threads, Blocks, and Grids",
     "Host and Device",
     "Writing our first CUDA Kernel",
     "How a thread finds its own work",
     "What happens inside the GPU when a kernel runs",
     "Memory in CUDA",
     "Why CUDA Kernels matter for AI",
     "Where CUDA Kernels work well and where they fail"
    ]
   },
   {
    "id": "how-does-a-google-tpu-work",
    "num": "17.3",
    "title": "Google TPUs: Purpose-Built Hardware for Neural Networks",
    "source": "",
    "covers": [
     "What is a TPU",
     "Why Google built the TPU",
     "A quick refresher: CPU and GPU",
     "The one operation that matters most",
     "The big idea: Systolic Array",
     "How data flows through a TPU",
     "The full journey of a TPU computation",
     "Why a TPU is so fast and power efficient",
     "Where TPUs are used",
     "Limitations of a TPU"
    ]
   },
   {
    "id": "how-does-an-lpu-work",
    "num": "17.4",
    "title": "Language Processing Units: A New Approach to LLM Inference",
    "source": "",
    "covers": [
     "What is an LPU?",
     "How an LLM writes text, one token at a time",
     "The real bottleneck is memory, not math",
     "Why a GPU struggles here",
     "Idea 1: Keep the model on the chip",
     "The problem with on-chip memory",
     "Idea 2: Remove all the guesswork",
     "Idea 3: A network that never waits",
     "The assembly line",
     "What happens when we send a prompt",
     "Why an LPU is fast, all in one place",
     "Where an LPU works well",
     "Where an LPU does not work well",
     "LPU vs GPU",
     "When to use which one"
    ]
   },
   {
    "id": "cloud-vs-on-device-model-deployment",
    "num": "17.5",
    "title": "Cloud vs Edge: Where Should Your Model Run?",
    "source": "",
    "covers": [
     "What is deployment?",
     "Training and inference",
     "What is Cloud Deployment?",
     "What is On-device Deployment?",
     "The one big difference",
     "The round trip problem",
     "Where does our data go?",
     "How big can the model be?",
     "Who pays the bill?",
     "The shipping problem",
     "What happens when the network is gone?",
     "The hybrid approach",
     "Some real examples",
     "Let's tabulate the difference",
     "When to use which one?",
     "Summary"
    ]
   },
   {
    "id": "android-tensorflow-lite-machine-learning-example",
    "num": "17.6",
    "title": "On-Device ML: A TensorFlow Lite Android Walkthrough",
    "source": "",
    "covers": []
   },
   {
    "id": "llm-routing",
    "num": "17.7",
    "title": "LLM Routing: Directing Each Query to the Best Model",
    "source": "",
    "covers": [
     "The Big Picture",
     "What is LLM Routing",
     "Why we need LLM Routing",
     "Anatomy of an LLM Router",
     "Routing Strategies",
     "A Full Trace Example",
     "LLM Routing vs Mixture of Experts",
     "When LLM Routing is Worth It",
     "Common Mistakes and How to Fix Them",
     "Quick Summary"
    ]
   },
   {
    "id": "design-a-real-time-voice-ai-agent",
    "num": "17.8",
    "title": "Building a Real-Time Voice AI Agent from Scratch",
    "source": "",
    "covers": [
     "What is a Voice AI Agent?",
     "Why is Real-Time Voice hard?",
     "Requirements",
     "Back-of-the-envelope estimation",
     "High-Level Architecture",
     "Component 1: Audio Transport",
     "Component 2: Voice Activity Detection and Turn Detection",
     "Component 3: Speech-to-Text (STT)",
     "Component 4: The Brain - LLM with Tools",
     "Component 5: Text-to-Speech (TTS)",
     "Approach 1: Cascaded Pipeline (STT -> LLM -> TTS)",
     "Approach 2: Speech-to-Speech Model",
     "Approach 3: Hybrid Approach",
     "Cascaded vs Speech-to-Speech: Comparison",
     "Latency Budget: Where every millisecond goes",
     "Handling Interruptions (Barge-in)",
     "Tool Calling in a Voice Agent",
     "Memory and Context",
     "Telephony: Connecting to real phone calls",
     "Scaling the system",
     "Edge Cases and how to handle them",
     "Observability and Evaluation",
     "Safety, Security, and Privacy",
     "Cost",
     "How to present this design in an interview"
    ]
   },
   {
    "id": "system-design",
    "num": "17.9",
    "title": "System Design Fundamentals for AI Engineers",
    "source": "",
    "covers": [
     "What is System Design?",
     "Why do we need it?",
     "What are the required concepts?"
    ]
   },
   {
    "id": "http-request-long-polling-websocket-sse",
    "num": "17.10",
    "title": "Transport Protocols: HTTP, WebSockets, and SSE Compared",
    "source": "",
    "covers": [
     "HTTP request",
     "HTTP Polling",
     "HTTP Long Polling",
     "WebSocket",
     "Server-Send Events(SSE)"
    ]
   },
   {
    "id": "voice-and-video-call",
    "num": "17.11",
    "title": "How do Voice And Video Call Work?",
    "source": "",
    "covers": [
     "Signaling",
     "Peer-to-Peer Connection",
     "STUN Server",
     "TURN Server"
    ]
   }
  ]
 },
 {
  "id": "frontier",
  "number": 18,
  "title": "The Edge of AI Research",
  "short": "Frontier Ideas",
  "icon": "✦",
  "accent": "#e4d4ff",
  "stage": "Frontier",
  "intro": [
   "In this module, we will learn the ideas that are shaping the future of AI, from models that learn an internal picture of the world to systems that improve themselves.",
   "By the end of this module, we will understand where AI research is heading next."
  ],
  "lessons": [
   {
    "id": "joint-embedding-predictive-architecture-jepa",
    "num": "18.1",
    "title": "JEPA: LeCun's Vision for World Model AI",
    "source": "",
    "covers": [
     "How humans and animals learn by observing the world",
     "Yann LeCun's vision of autonomous machine intelligence",
     "A simple everyday analogy to build the intuition",
     "What does JEPA mean",
     "What is an embedding or representation space",
     "The problem with predicting raw pixels",
     "The problem with contrastive methods",
     "The core idea of JEPA",
     "The building blocks of JEPA",
     "The energy-based view in simple words",
     "How I-JEPA works (for images)",
     "V-JEPA and the world-model vision",
     "When and why JEPA matters"
    ]
   },
   {
    "id": "how-do-world-models-work",
    "num": "18.2",
    "title": "World Models: Teaching AI to Simulate Its Environment",
    "source": "",
    "covers": [
     "What is an environment, a state, and an action",
     "What is a World Model",
     "The human analogy: imagining a move before making it",
     "Why we need a World Model",
     "How a World Model learns: predicting the next state",
     "The latent state: compressing what we see",
     "Imagining the future: rolling out without touching the real world",
     "Dreamer-style agents that plan inside the model",
     "World Models and predicting the future",
     "World Models in the real world"
    ]
   },
   {
    "id": "what-is-recursive-self-improvement-rsi",
    "num": "18.3",
    "title": "Recursive Self-Improvement: Can AI Improve Itself Indefinitely?",
    "source": "",
    "covers": [
     "What is Recursive Self-Improvement?",
     "Why does Recursive Self-Improvement matter?",
     "How does an AI get better today?",
     "How does Recursive Self-Improvement work?",
     "A simple example with numbers",
     "Two kinds of improvement",
     "What exists in the real world today?",
     "Intelligence explosion",
     "Where it works well and where it fails",
     "Keeping humans in the loop",
     "Recursive Self-Improvement vs Normal Training"
    ]
   }
  ]
 },
 {
  "id": "interviews",
  "number": 19,
  "title": "AI Engineering Career Prep",
  "short": "Career Prep",
  "icon": "✓",
  "accent": "#d0f4c0",
  "stage": "Career",
  "intro": [
   "We have learned everything from machine-learning foundations to AI agents in production. Now we turn that knowledge into clear interview answers and confident system designs."
  ],
  "lessons": [
   {
    "id": "ai-engineering-interview-prep",
    "num": "19.1",
    "title": "Cracking the AI Engineering Interview",
    "source": "",
    "covers": [
     "How AI engineering interviews are structured",
     "Explaining a concept clearly in 60 seconds",
     "Must-know questions from every module",
     "The AI system design round",
     "A worked system design: a RAG support assistant",
     "A 30-day revision plan"
    ]
   }
  ]
 }
];
export const allLessons = modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id, moduleNumber: m.number })));
export const lessonIds = allLessons.map(l => l.id);
export const lessonById = Object.fromEntries(allLessons.map(l => [l.id, l]));
export const moduleOf = id => modules.find(m => m.lessons.some(l => l.id === id));

// Useful links, shown on /resources. Lessons themselves do not link out; every
// external reference lives here. Each entry names the lesson it supports.
export const resources = [
  { group: 'Research papers', note: 'The original papers behind ideas taught in the course.', items: [
    { title: 'Attention Is All You Need', by: 'Vaswani et al., 2017', url: 'https://arxiv.org/abs/1706.03762', about: 'The paper that introduced the Transformer.' },
    { title: 'LoRA: Low-Rank Adaptation of Large Language Models', by: 'Hu et al., 2021', url: 'https://arxiv.org/abs/2106.09685', about: 'Cheap fine-tuning with small low-rank matrices.' },
    { title: 'Prefix-Tuning', by: 'Li and Liang, 2021', url: 'https://arxiv.org/abs/2101.00190', about: 'Learning a short task-specific prefix while the model stays frozen.' },
    { title: 'Distilling the Knowledge in a Neural Network', by: 'Hinton, Vinyals and Dean, 2015', url: 'https://arxiv.org/abs/1503.02531', about: 'Knowledge distillation from a teacher to a student model.' },
    { title: 'Deep Reinforcement Learning from Human Preferences', by: 'Christiano et al., 2017', url: 'https://arxiv.org/abs/1706.03741', about: 'Learning a reward model from human comparisons.' },
    { title: 'Training Language Models to Follow Instructions with Human Feedback', by: 'Ouyang et al., 2022', url: 'https://arxiv.org/abs/2203.02155', about: 'The InstructGPT paper: RLHF applied to language models.' },
    { title: 'Proximal Policy Optimization Algorithms', by: 'Schulman et al., 2017', url: 'https://arxiv.org/abs/1707.06347', about: 'PPO, the policy-gradient method used in RLHF.' },
    { title: 'Direct Preference Optimization', by: 'Rafailov et al., 2023', url: 'https://arxiv.org/abs/2305.18290', about: 'Preference alignment without a separate reward model.' },
    { title: 'DeepSeekMath (introduces GRPO)', by: 'Shao et al., 2024', url: 'https://arxiv.org/abs/2402.03300', about: 'Group Relative Policy Optimization.' },
    { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', by: 'Lewis et al., 2020', url: 'https://arxiv.org/abs/2005.11401', about: 'The paper that named RAG.' },
    { title: 'RoFormer: Rotary Position Embedding', by: 'Su et al., 2021', url: 'https://arxiv.org/abs/2104.09864', about: 'RoPE, the positional scheme used by many modern LLMs.' },
  ] },
  { group: 'Official documentation', note: 'Reference manuals for the tools used in the code examples.', items: [
    { title: 'Python documentation', url: 'https://docs.python.org/3/', about: 'The language used in every code example and in the Practice editor.' },
    { title: 'NumPy documentation', url: 'https://numpy.org/doc/', about: 'Arrays and linear algebra.' },
    { title: 'PyTorch documentation', url: 'https://pytorch.org/docs/stable/', about: 'The deep-learning framework most examples refer to.' },
    { title: 'scikit-learn user guide', url: 'https://scikit-learn.org/stable/user_guide.html', about: 'Classical machine-learning algorithms and metrics.' },
    { title: 'Hugging Face Transformers', url: 'https://huggingface.co/docs/transformers', about: 'Loading, running and fine-tuning Transformer models.' },
    { title: 'vLLM documentation', url: 'https://docs.vllm.ai/', about: 'High-throughput LLM serving.' },
  ] },
  { group: 'Standards and specifications', note: 'Open formats covered in the agents modules.', items: [
    { title: 'Model Context Protocol', url: 'https://modelcontextprotocol.io/', about: 'The open protocol for connecting models to tools and data.' },
    { title: 'Agent Skills', url: 'https://agentskills.io', about: 'The open specification for packaging agent skills.' },
  ] },
];

// Blog articles. Each one is plain data, shown by src/Blog.jsx and prerendered for search engines.
export const posts = [
  {
    slug: 'what-is-ai-engineering',
    title: 'What Is AI Engineering? What an AI Engineer Does Day to Day',
    description: "AI engineering explained in plain English: what the field is, what an AI engineer does each day, the skills involved, and how it differs from ML work.",
    date: '2026-10-09',
    minutes: 7,
    keywords: ['what is ai engineering', 'ai engineering', 'what does an ai engineer do', 'ai engineer', 'ai engineer job description', 'ai engineer responsibilities', 'ai engineering meaning'],
    intro: [
      "AI engineering is the work of building useful software on top of AI models. Most of the time the model already exists. It is a large language model (LLM) that someone else trained. The AI engineer takes that model and turns it into a product: a support assistant, a search tool over company documents, a coding helper, an agent that completes a task from start to finish.",
      "So an AI engineer is a software engineer who knows how models behave and how to build around them. They pick a model, give it the right context, connect it to data and tools, measure the quality of its answers, keep it safe, and keep it fast and affordable once real users arrive.",
    ],
    sections: [
      {
        h: 'What is AI engineering in simple words?',
        body: [
          "Think of a model as an engine. An engine alone does not take anyone anywhere. Someone has to build the car around it: the steering, the brakes, the fuel system, the dashboard. AI engineering is building the car.",
          "The field became its own job when capable models became available through an API. Before that, a team that wanted AI in a product usually had to collect data and train a model first. Today a team can call a strong model on day one. The hard part has moved. The question is no longer only how to train a model. It is how to make a model reliable inside a real product.",
          "That is why AI engineering sits between two older fields. It borrows an understanding of models from machine learning, and it borrows the habits of shipping and maintaining systems from software engineering.",
        ],
      },
      {
        h: 'What does an AI engineer do day to day?',
        body: [
          "The exact tasks change from company to company, but a normal week tends to include the same kinds of work.",
        ],
        list: [
          "Writing and testing prompts, and deciding what context the model should see for each request.",
          "Building retrieval so the model can answer from company documents instead of guessing. This is called RAG.",
          "Defining tools the model can call, such as a search function, a database query or an internal API.",
          "Building evaluation sets: a fixed list of inputs with expected behaviour, so that every change can be measured.",
          "Reading traces of failed requests to find out why an answer went wrong.",
          "Reducing cost and response time through caching, smaller models, routing and streaming.",
          "Adding guardrails against unsafe output and against prompt injection.",
          "Working with product managers and designers to decide what the feature should and should not do.",
        ],
      },
      {
        h: 'What does an AI engineer need to understand about models?',
        body: [
          "An AI engineer does not need to invent new model architectures. But treating the model as a black box causes trouble quickly. When an answer is wrong, you need a mental picture of what happened inside.",
          "A useful minimum is this. Text is split into tokens. Tokens become vectors called embeddings. Attention layers let each token use the other tokens as context. The model then predicts one token at a time, and sampling settings such as temperature decide how much variety you get. With this picture you can explain many everyday problems: why long prompts cost more, why the model forgets something placed in the middle of a long input, why the same prompt gives different answers on different runs.",
          "It also helps to know how models are adapted. Fine-tuning changes the behaviour of a model with extra training. Quantization shrinks a model so it runs on cheaper hardware. Both come up in real design decisions.",
        ],
      },
      {
        h: 'AI engineering vs machine learning engineering',
        body: [
          "The two roles overlap, and job titles are not used consistently. As a rule of thumb, a machine learning engineer spends more time training, tuning and deploying models on data the company owns. An AI engineer spends more time building applications on top of models that already exist.",
          "Both need solid software skills. Both need to measure quality honestly. The difference is where most of the hours go. If you want the longer comparison, including data scientists, read our article on the three roles.",
        ],
      },
      {
        h: 'What are the main parts of an AI application?',
        body: [
          "Most AI products are built from the same handful of parts. Learning these parts is a large share of learning the job.",
        ],
        table: {
          head: ['Part', 'What it does'],
          rows: [
            ['Model', 'Reads the input and generates the output, one token at a time.'],
            ['Prompt and context', 'The instructions and information the model sees for this request.'],
            ['Retrieval (RAG)', 'Finds relevant documents and adds them to the context.'],
            ['Tools', 'Functions the model can call to look things up or take actions.'],
            ['Agent loop', 'Lets the model work in several steps until the task is done.'],
            ['Evaluation', 'Measures whether answers are correct, useful and safe.'],
            ['Serving', 'Runs the model quickly and at a cost the product can afford.'],
          ],
        },
      },
      {
        h: 'Is AI engineering a good field to learn?',
        body: [
          "It is a good fit if you like building things and you are comfortable with a system that is not fully predictable. A normal function returns the same output for the same input. A model does not always do that. Much of the craft is making an uncertain part behave well enough to trust.",
          "It is also a field where the foundations last longer than the tools. Libraries and model names change often. Tokens, embeddings, attention, retrieval, evaluation and the agent loop stay. If you learn those well, a new framework is much easier to pick up.",
          "No course or article can promise a job. What steady study can give you is the ability to read a system, explain why it behaves the way it does, and build one yourself.",
        ],
      },
      {
        h: 'How do you start learning AI engineering?',
        body: [
          "Start with the vocabulary, then go one layer deeper each week. A workable order is: machine learning basics, neural networks, the Transformer, how an LLM generates text, prompting, RAG, agents, then evaluation, safety and serving.",
          "The AI Engineering Bootcamp on this site follows that order across 19 modules and 149 lessons. The first lesson is free and covers the six words you will hear in every AI engineering conversation: LLM, RAG, MCP, agent, fine-tuning and quantization.",
        ],
      },
    ],
    faqs: [
      ['Is AI engineering the same as machine learning?', 'No. Machine learning is the science of training models from data. AI engineering uses trained models, mostly LLMs, to build working products. An AI engineer needs to understand machine learning but spends most of the time building around the model.'],
      ['Does an AI engineer need to know how to code?', 'Yes. AI engineering is a software job. Python is the most common language, and you also need the usual skills of working with APIs, data and tests.'],
      ['Does an AI engineer train models?', 'Sometimes, but not usually from scratch. Fine-tuning an existing model for a narrow task is common. Training a large model from nothing is rare outside research labs.'],
      ['Do I need a degree to learn AI engineering?', 'You can learn the material without one. Basic programming and high-school math are enough to begin, and the rest can be learned step by step. Hiring requirements differ between employers.'],
    ],
    links: [
      ['/lesson/six-words-of-ai-engineering', 'Free lesson: Six Concepts Every AI Engineer Must Know'],
      ['/ai-engineer-roadmap', 'AI engineer roadmap: what to learn, in order'],
      ['/blog/ai-engineer-vs-ml-engineer-vs-data-scientist', 'AI engineer vs ML engineer vs data scientist'],
      ['/curriculum', 'See the full curriculum'],
      ['/glossary', 'Look up a term in the glossary'],
    ],
  },
  {
    slug: 'how-to-become-an-ai-engineer',
    title: 'How to Become an AI Engineer: A Step-by-Step Roadmap',
    description: "A clear roadmap to become an AI engineer: what to learn first, the order that works, how long each step takes, and what to build along the way.",
    date: '2026-10-06',
    minutes: 8,
    keywords: ['how to become an ai engineer', 'ai engineer roadmap', 'ai engineering roadmap', 'become an ai engineer', 'ai engineer learning path', 'how to start ai engineering', 'ai engineer from scratch'],
    intro: [
      "To become an AI engineer, learn the subject in layers: programming, machine learning basics, deep learning, the Transformer, then the building blocks of real products, which are prompting, RAG, agents, evaluation and serving. Build something small at every layer. The order matters more than the speed.",
      "This roadmap lists the steps, says why each one is there, and points out where people usually get stuck.",
    ],
    sections: [
      {
        h: 'What do you need before you start?',
        body: [
          "You need two things. The first is basic programming, ideally in Python: variables, functions, loops, lists and dictionaries, reading a file, calling an API. The second is high-school math. You should be comfortable with a graph, a slope and a simple probability.",
          "You do not need a background in machine learning, and you do not need to finish a math degree first. A common mistake is to spend months on linear algebra before touching a model. Learn the math when a concept needs it. Gradient descent is a good reason to revise slopes. Embeddings are a good reason to learn what a vector is.",
        ],
      },
      {
        h: 'The AI engineer roadmap, step by step',
        body: [
          "Each step below depends on the one before it. If a later step feels confusing, the cause is usually a gap in an earlier one.",
        ],
        steps: [
          "Learn the six core words: LLM, RAG, MCP, agent, fine-tuning and quantization. You will not understand them fully yet. The aim is a map of the territory.",
          "Learn machine learning basics: how a model learns from data, supervised and unsupervised learning, regression, loss functions, overfitting, regularization, precision and recall.",
          "Learn deep learning: what a neural network is, gradient descent, backpropagation, cross-entropy loss, dropout and normalization.",
          "Learn the Transformer: tokenization, embeddings, self-attention, multi-head attention, positional encoding and the feed-forward layer.",
          "Learn how an LLM produces text: autoregressive generation, temperature, top-k and top-p sampling, streaming and context limits.",
          "Learn how models are adapted: fine-tuning, LoRA, distillation and the basics of alignment training.",
          "Learn prompting and context engineering: chain of thought, prompt chaining, caching and keeping the context window useful.",
          "Learn RAG: embeddings for search, vector databases, hybrid search, rerankers and chunking.",
          "Learn agents: function calling, the agent loop, ReAct, planning, memory, MCP and multi-agent systems.",
          "Learn production skills: inference optimization, evaluation, observability, guardrails, prompt injection and system design.",
        ],
      },
      {
        h: 'Can you skip machine learning and go straight to LLMs?',
        body: [
          "You can build a demo that way. Many people do. The trouble starts when the demo misbehaves. Without the foundations you cannot tell whether a bad answer comes from the prompt, the retrieved documents, the sampling settings or the model itself.",
          "The foundations do not need to take long. A few focused weeks on machine learning and neural networks is enough to make the Transformer understandable. After that, every later topic is easier, because you can reason about it instead of memorising recipes.",
          "If you already build software for a living and want quick wins, it is fine to call an LLM API in the first week to stay motivated. Then go back and fill in the layers underneath.",
        ],
      },
      {
        h: 'How long does it take to become an AI engineer?',
        body: [
          "It depends on where you start and how many hours you have. A working developer who studies an hour or two a day can cover the core concepts in a few months. Someone new to programming needs longer, because programming itself takes practice.",
          "The lessons in the AI Engineering Bootcamp add up to about 63 hours of material. At one or two lessons a day that is around three to four months. Reaching the point where you can build and debug systems confidently takes more time on top, because that part comes from projects.",
          "Be careful with any plan that promises a fixed result by a fixed date. Aim for a steady pace you can keep.",
        ],
      },
      {
        h: 'What projects should you build?',
        body: [
          "Build small projects that each teach one layer. A few projects you understand fully are worth more than many copied ones.",
        ],
        list: [
          "A question-answering tool over a set of documents you care about. This teaches chunking, embeddings, retrieval and citation.",
          "An evaluation set for that tool: a few dozen questions with expected answers, run after every change.",
          "An agent with two or three tools, a step limit and a log of every step it takes.",
          "A small model running on your own machine in a quantized format, so you see the trade between size, speed and quality.",
        ],
      },
      {
        h: 'Common mistakes on the way',
        body: [
          "Most people who stall do so for one of a few reasons.",
        ],
        list: [
          "Learning a framework before the concept. A library hides the agent loop. Write the loop yourself once.",
          "Skipping evaluation. Without a test set you are judging quality by feel.",
          "Collecting courses instead of finishing one. Pick one path and complete it in order.",
          "Avoiding the math entirely. You do not need much, but following one worked example of backpropagation and attention pays off for years.",
          "Studying without recall. Close the page and explain the idea in your own words. If you cannot, read it again.",
        ],
      },
      {
        h: 'How to use this site as your roadmap',
        body: [
          "The roadmap page on this site lists the same steps with the study time for each module and a link to every lesson. Each lesson ends with a five-question quiz, and you need four right to pass, so you find gaps early. The practice area and the labs let you move the sliders yourself: change the temperature, watch attention weights, step through retrieval.",
          "There are three tracks. ML and Deep Learning covers the foundations. Generative AI Engineering covers LLMs and the systems around them. Complete AI Engineer includes both, plus interview preparation and a certificate of completion.",
        ],
      },
    ],
    faqs: [
      ['Can I become an AI engineer without a degree?', 'You can learn the skills without a degree. Basic programming and high-school math are enough to begin. Whether an employer asks for a degree varies, so check the roles you are aiming at.'],
      ['Which programming language should I learn for AI engineering?', 'Python. Most model libraries, examples and tools use it. Add JavaScript or TypeScript later if you build web products.'],
      ['How much math do I need to become an AI engineer?', 'Less than many people fear. You need vectors, matrix multiplication, slopes and basic probability. All of it can be learned alongside the concepts that use it.'],
      ['Should I learn machine learning before generative AI?', 'Yes, at least the basics. A few weeks on how models learn, loss functions and neural networks makes Transformers and LLMs far easier to understand.'],
      ['Can a software engineer move into AI engineering?', 'Yes, and it is a common route. Software engineers already know APIs, testing and deployment. What they add is an understanding of models, retrieval, agents and evaluation.'],
    ],
    links: [
      ['/ai-engineer-roadmap', 'AI engineer roadmap with study hours'],
      ['/lesson/six-words-of-ai-engineering', 'Free lesson: Six Concepts Every AI Engineer Must Know'],
      ['/module/ml-foundations', 'Module 2: Learning from Data'],
      ['/blog/ai-engineer-skills', 'Skills every AI engineer needs'],
      ['/pricing', 'Compare the three tracks'],
    ],
  },
  {
    slug: 'ai-engineer-vs-ml-engineer-vs-data-scientist',
    title: 'AI Engineer vs ML Engineer vs Data Scientist: Differences',
    description: "AI engineer vs ML engineer vs data scientist: what each role builds, the skills and tools each one uses, where they overlap, and how to choose a path.",
    date: '2026-10-02',
    minutes: 7,
    keywords: ['ai engineer vs ml engineer', 'ai engineer vs data scientist', 'ml engineer vs data scientist', 'ai engineer vs machine learning engineer', 'difference between ai engineer and ml engineer', 'ai engineering vs data science'],
    intro: [
      "The short answer: a data scientist answers questions with data, a machine learning engineer trains models and runs them in production, and an AI engineer builds products on top of existing models, mostly large language models. The three roles share a lot of knowledge. What differs is the thing each one delivers.",
      "Job titles are used loosely, so always read the description of the work. The sections below explain the usual meaning of each title.",
    ],
    sections: [
      {
        h: 'What does a data scientist do?',
        body: [
          "A data scientist starts with a question. Why did sign-ups drop last month? Which customers are likely to leave? Did the new checkout page help? The work is to find the data, clean it, analyse it and explain the result to people who will make a decision.",
          "The main tools are SQL, statistics, experiments and charts. A data scientist may train a model, but the model is often a means to an answer. The typical output is a finding or a recommendation, not a running service.",
        ],
      },
      {
        h: 'What does a machine learning engineer do?',
        body: [
          "A machine learning engineer makes models work as dependable software. They build the pipeline that prepares training data, train and tune the model, deploy it behind an API, and watch it after launch. If the real world changes and the model gets worse, they notice and retrain.",
          "The work needs strong engineering skills and a deep understanding of how models learn: features, loss functions, regularization, gradient descent and the metrics that fit the problem. Recommendation systems, fraud detection and ranking are typical examples.",
        ],
      },
      {
        h: 'What does an AI engineer do?',
        body: [
          "An AI engineer usually starts with a model that already exists and builds a product around it. The work is prompting and context engineering, retrieval over company data, tools and agents, evaluation, guardrails and serving.",
          "The AI engineer rarely trains a large model from scratch. They may fine-tune one for a narrow task. Most of their time goes into making a model that is general and a little unpredictable behave well inside one specific product.",
        ],
      },
      {
        h: 'AI engineer vs ML engineer vs data scientist at a glance',
        body: [
          "This table shows the usual centre of each role. Real jobs mix the columns.",
        ],
        table: {
          head: ['', 'Data scientist', 'ML engineer', 'AI engineer'],
          rows: [
            ['Main output', 'Analysis and recommendations', 'Trained models in production', 'Products built on existing models'],
            ['Starts from', 'A business question', 'A dataset and a target to predict', 'A pre-trained model and a user need'],
            ['Core skills', 'Statistics, SQL, experiments', 'Training, pipelines, deployment', 'Prompting, RAG, agents, evaluation'],
            ['Typical data', 'Tables of historical records', 'Labeled training data', 'Documents, conversations, tool results'],
            ['Trains models', 'Sometimes', 'Most of the time', 'Rarely, mostly fine-tuning'],
            ['Closest neighbour', 'Analyst', 'Backend engineer', 'Product engineer'],
          ],
        },
      },
      {
        h: 'Where do the three roles overlap?',
        body: [
          "All three need to understand how a model learns and how to judge whether it is good. Precision and recall matter to a data scientist checking a churn model, to an ML engineer tuning a classifier and to an AI engineer measuring retrieval.",
          "In a small company one person often does all three jobs. In a large one the roles are separate, and they hand work to each other. A data scientist may find that a problem is worth solving. An ML engineer may train a model for it. An AI engineer may put that model, or an LLM, inside a feature users touch.",
          "The boundary between ML engineer and AI engineer is the blurriest. An ML engineer who serves LLMs at scale and an AI engineer who fine-tunes them are doing much the same work.",
        ],
      },
      {
        h: 'Which role should you choose?',
        body: [
          "Pick by the kind of work you enjoy, not by the title that sounds newest.",
        ],
        list: [
          "Choose data science if you like questions, statistics and explaining findings to people.",
          "Choose ML engineering if you like training models, working with data pipelines and improving a metric over time.",
          "Choose AI engineering if you like building products and you want to work with LLMs, retrieval and agents.",
        ],
      },
      {
        h: 'Can you move from one role to another?',
        body: [
          "Yes. The moves are common because the foundations are shared.",
          "A data scientist moving to AI engineering usually needs more software practice: APIs, testing, deployment. An ML engineer moving to AI engineering usually needs the application layer: prompting, RAG, agents and LLM evaluation. A software engineer moving to AI engineering needs the model layer: machine learning basics, neural networks and the Transformer.",
          "The AI Engineering Bootcamp is laid out with these moves in mind. The ML and Deep Learning track covers the model layer. The Generative AI Engineering track covers the application layer. The Complete AI Engineer track covers both in order.",
        ],
      },
      {
        h: 'What should you learn first if you are undecided?',
        body: [
          "Start with the part all three roles share. Learn how a model learns from data, how to split data into training and test sets, what overfitting is, and how to pick a metric. This takes a few weeks and none of it is wasted, whichever way you go.",
          "After that, try one small task from each role. Analyse a public dataset and write up what you found. Train a simple classifier and measure it. Build a small question-answering tool over a few documents with an LLM. Notice which of the three you wanted to keep working on after it was finished. That is usually a better guide than any comparison table.",
        ],
      },
    ],
    faqs: [
      ['Is an AI engineer the same as an ML engineer?', 'Not quite. An ML engineer mostly trains and deploys models. An AI engineer mostly builds applications on top of existing models, especially LLMs. Many companies use the titles loosely, so read the job description.'],
      ['Is AI engineering harder than data science?', 'They are hard in different ways. Data science leans on statistics and careful reasoning about data. AI engineering leans on software design and on making an unpredictable model reliable.'],
      ['Can a data scientist become an AI engineer?', 'Yes. A data scientist already understands models and metrics. The gaps are usually software engineering practice and the LLM application layer: RAG, agents and evaluation.'],
      ['Do AI engineers need machine learning knowledge?', 'Yes. They do not need to be researchers, but they need to understand how models learn and how LLMs work inside. Without that, debugging becomes guesswork.'],
    ],
    links: [
      ['/blog/what-is-ai-engineering', 'What is AI engineering?'],
      ['/module/ml-foundations', 'Module 2: Learning from Data'],
      ['/lesson/precision-vs-recall', 'Lesson: Precision and Recall: Picking the Right Metric'],
      ['/pricing', 'Compare the three tracks'],
      ['/faq', 'Read the course FAQ'],
    ],
  },
  {
    slug: 'how-to-choose-an-ai-engineering-course',
    title: 'How to Choose an AI Engineering Course: What It Must Cover',
    description: "How to choose an AI engineering course: the topics a good one must cover, the signs of a weak syllabus, and a checklist to compare courses before you pay.",
    date: '2026-09-29',
    minutes: 7,
    keywords: ['ai engineering course', 'best ai engineering course', 'ai engineer course', 'how to choose an ai course', 'ai engineering bootcamp', 'generative ai course', 'ai engineering syllabus'],
    intro: [
      "A good AI engineering course teaches three things in order: how models work, how to build on top of them, and how to run them in production. It makes you practise each idea, and it checks that you understood before you move on. If a course misses one of the three, you will feel the gap as soon as you build something real.",
      "This guide gives you a checklist you can apply to any course, including ours.",
    ],
    sections: [
      {
        h: 'First decide what kind of course you need',
        body: [
          "The words AI course cover very different things. A machine learning course teaches you to train models on data. A generative AI course teaches you to build with LLMs. An AI engineering course should connect the two and add the production side.",
          "Your starting point matters as well. A software engineer usually needs the model layer explained from the beginning. A data scientist often knows the models and needs the application layer. A student needs both, in order. Write down what you can already do, then look for the course that fills the rest.",
        ],
      },
      {
        h: 'What should an AI engineering course cover?',
        body: [
          "Check the syllabus against this list. A serious course touches every line.",
        ],
        list: [
          "Machine learning basics: supervised and unsupervised learning, regression, loss functions, overfitting, regularization, evaluation metrics.",
          "Deep learning: neural networks, gradient descent, backpropagation, normalization, dropout.",
          "The Transformer: tokenization, embeddings, self-attention, multi-head attention, positional encoding.",
          "Text generation: autoregressive decoding, temperature, top-k and top-p sampling, context limits.",
          "Adapting models: fine-tuning, LoRA, distillation.",
          "Prompting and context engineering.",
          "RAG: vector databases, semantic and hybrid search, reranking, chunking.",
          "Agents: function calling, the agent loop, planning, memory, MCP, multi-agent systems.",
          "Inference: the KV cache, batching, quantization and serving engines.",
          "Evaluation, observability, guardrails and prompt injection.",
          "System design for AI products.",
        ],
      },
      {
        h: 'How can you tell if a course goes deep enough?',
        body: [
          "Open one lesson in the middle of the syllabus and look for three things. Does it explain why the technique exists, what problem it solves? Does it show how it works step by step, with small numbers you can follow? Does it say where it is used and where it fails?",
          "A shallow course shows you which function to call. A deep one shows you what the function does, so you can fix it when it breaks. A good test is attention. If the course says attention lets the model focus on important words and stops there, it is shallow. If it walks through queries, keys and values with a worked example, it goes deeper.",
        ],
      },
      {
        h: 'Does the course make you practise?',
        body: [
          "Watching a video feels like learning, but much of it fades unless you use it. Look for ways the course makes you do something.",
        ],
        list: [
          "Interactive labs where you change a setting and see the result.",
          "Code you can run, with real output shown.",
          "A quiz after every lesson, with explanations for wrong answers.",
          "A final exam or project that covers the whole course.",
          "A free sample, so you can judge the teaching style before you pay.",
        ],
      },
      {
        h: 'Warning signs in an AI course',
        body: [
          "Some patterns should make you careful.",
        ],
        list: [
          "A promise of a job or a salary. No course controls hiring.",
          "A syllabus built around one framework. Frameworks change. Concepts stay.",
          "No machine learning or deep learning at all. You will be able to copy a demo and not debug it.",
          "No evaluation, safety or serving. Those are the difference between a demo and a product.",
          "Vague lesson titles with no list of what each lesson covers.",
          "Old content with no sign of updates in a field that moves quickly.",
        ],
      },
      {
        h: 'Questions to ask before you pay',
        body: [
          "Put these questions to any course page. If the page cannot answer most of them, ask the provider or keep looking.",
        ],
        steps: [
          "Can I see the full list of lessons and what each one covers?",
          "Can I try a real lesson for free?",
          "What do I need to know before I start?",
          "How many hours of material are there, and how long do I keep access?",
          "How does the course check that I understood each lesson?",
          "Does it cover evaluation, safety and inference, or does it stop at building a chatbot?",
          "What do I get at the end, and what does it actually certify?",
        ],
      },
      {
        h: 'How the AI Engineering Bootcamp answers these questions',
        body: [
          "You should hold our course to the same checklist. The AI Engineering Bootcamp has 19 modules and 149 video lessons, about 63 hours in total. Every lesson and what it covers is listed on the curriculum page. The first lesson and the Temperature lab are free.",
          "The prerequisites are basic programming, preferably Python, and high-school math. Each lesson ends with a five-question quiz and you need four correct to pass. There are interactive labs, a practice area, a final exam and a certificate of completion on the Complete AI Engineer track.",
          "There are three tracks so you can buy only the part you need: ML and Deep Learning, Generative AI Engineering, or Complete AI Engineer. The certificate shows that you completed the course and passed its checks. It is not a promise of employment.",
        ],
      },
    ],
    faqs: [
      ['What is the best AI engineering course for beginners?', 'The best one for you starts from machine learning basics, explains every term the first time it appears, and makes you practise. Compare the full syllabus and try a free lesson before choosing.'],
      ['Is an AI engineering course worth it?', 'A structured course saves you from learning topics in the wrong order and from missing whole areas such as evaluation. It is worth it if you finish it and build alongside it. It does not replace practice.'],
      ['How long does an AI engineering course take?', 'It depends on the course and your pace. Our bootcamp is about 63 hours of material, which is around three to four months at one or two lessons a day.'],
      ['Do I need to know Python before an AI engineering course?', 'Basic Python helps a lot, because most examples use it. You do not need to be an expert. Functions, loops, lists and dictionaries are enough to follow along.'],
    ],
    links: [
      ['/curriculum', 'See all 149 lessons in the curriculum'],
      ['/lesson/six-words-of-ai-engineering', 'Try the free first lesson'],
      ['/lab', 'Open the interactive labs'],
      ['/pricing', 'Compare tracks and prices'],
      ['/blog/how-to-become-an-ai-engineer', 'How to become an AI engineer: step-by-step roadmap'],
    ],
  },
  {
    slug: 'machine-learning-vs-deep-learning-vs-generative-ai',
    title: 'Machine Learning vs Deep Learning vs Generative AI Explained',
    description: "Machine learning vs deep learning vs generative AI: how the three terms fit inside each other, what each is good at, with examples and when to use which.",
    date: '2026-09-26',
    minutes: 7,
    keywords: ['machine learning vs deep learning', 'deep learning vs generative ai', 'machine learning vs generative ai', 'ai vs machine learning vs deep learning', 'difference between machine learning and deep learning', 'what is generative ai'],
    intro: [
      "The three terms are not rivals. They sit inside each other. Artificial intelligence is the widest term: any system that does a task we associate with intelligence. Machine learning is the part of AI where the system learns from data instead of following hand-written rules. Deep learning is the part of machine learning that uses neural networks with many layers. Generative AI is a use of deep learning where the model creates new content such as text, images, audio or code.",
      "So every generative AI model is a deep learning model, and every deep learning model is a machine learning model. The reverse is not true.",
    ],
    sections: [
      {
        h: 'What is machine learning?',
        body: [
          "In ordinary programming, a person writes the rules. In machine learning, a person provides examples and the computer finds the rules. You show a model many emails marked spam or not spam, and it learns a pattern that separates them.",
          "There are a few ways a model can learn. In supervised learning every example comes with the right answer. In unsupervised learning there are no answers, and the model looks for structure, such as groups of similar customers. In reinforcement learning an agent tries actions and learns from rewards.",
          "Classic machine learning works well on data that fits in a table: rows of customers, columns of facts about them. Linear regression predicts a number, such as a price. Logistic regression predicts a category, such as will this loan be repaid. These models are quick to train, cheap to run and easy to explain.",
        ],
      },
      {
        h: 'What is deep learning?',
        body: [
          "Deep learning is machine learning with neural networks that have many layers. A neural network is a stack of simple units. Each unit multiplies its inputs by weights, adds a bias and passes the result on. One unit can do very little. Many layers of them can represent very complicated patterns.",
          "The key difference from classic machine learning is who designs the features. In classic machine learning a person decides what the model looks at, for example the number of links in an email. This is called feature engineering. A deep network learns its own features from raw data. Early layers pick up simple patterns and later layers combine them into richer ones.",
          "That is why deep learning took over tasks with raw, unstructured input: images, sound and language. The cost is that it needs more data and more computing power, and it is harder to explain why the model gave a particular answer.",
        ],
      },
      {
        h: 'What is generative AI?',
        body: [
          "Most earlier models were built to judge an input. Is this email spam? Is there a cat in this photo? What will the price be? Generative AI is built to produce something new: a paragraph, a picture, a piece of code.",
          "A large language model does this by predicting the next token, again and again. Given the text so far, it gives a probability to every possible next piece of text, picks one, adds it and repeats. Image models often use a different method called diffusion, which starts from noise and removes it step by step until a picture appears.",
          "Generative AI is defined by what it outputs, not by a separate kind of math. Underneath it is deep learning, and today most of it is built on one architecture, the Transformer.",
        ],
      },
      {
        h: 'Machine learning vs deep learning vs generative AI: comparison table',
        body: [
          "The table compares the typical case for each. There are exceptions in every row.",
        ],
        table: {
          head: ['', 'Machine learning', 'Deep learning', 'Generative AI'],
          rows: [
            ['Main idea', 'Learn patterns from data', 'Learn with many-layer neural networks', 'Create new content'],
            ['Typical input', 'Tables of numbers and categories', 'Images, audio, text', 'A prompt'],
            ['Typical output', 'A number or a label', 'A label, a score or a vector', 'Text, images, audio, code'],
            ['Features', 'Designed by people', 'Learned by the network', 'Learned by the network'],
            ['Data needed', 'Can work with little', 'Usually a lot', 'Very large for training, little to use'],
            ['Example', 'Predicting house prices', 'Recognising objects in photos', 'A chat assistant'],
          ],
        },
      },
      {
        h: 'When should you use which?',
        body: [
          "Newer is not always better. Pick the simplest tool that solves the problem.",
        ],
        list: [
          "Use classic machine learning when your data is a table and you need a prediction you can explain, such as a risk score or a demand forecast.",
          "Use deep learning when the input is raw, such as images, speech or long text, and you have enough examples to train or fine-tune a network.",
          "Use generative AI when the output must be language or other content, or when the task is open-ended and hard to describe with labels: summarising, drafting, answering questions, writing code.",
          "Combine them when it helps. A product can use an LLM to talk to the user and a small classic model to score a transaction.",
        ],
      },
      {
        h: 'Common confusions cleared up',
        body: [
          "Is ChatGPT machine learning or deep learning? Both, and generative AI as well. It is a generative model, built with deep learning, which is a kind of machine learning.",
          "Is deep learning always better than machine learning? No. On small tables of data a simple model often does as well and costs far less to run and maintain.",
          "Is generative AI the same as an LLM? An LLM is one kind of generative model, the kind that produces text. Image, audio and video generators are generative AI too.",
          "Is AI the same as machine learning? No. AI is the wider goal. Machine learning is the most successful way of reaching it so far. Older AI systems used hand-written rules with no learning at all.",
        ],
      },
      {
        h: 'Which one should you learn first?',
        body: [
          "Learn them in the order they are nested. Machine learning first, because it gives you the ideas everything else uses: training data, loss, overfitting, evaluation. Deep learning second, because it explains how a neural network learns through gradient descent and backpropagation. Generative AI third, because by then the Transformer and next-token prediction will make sense.",
          "The AI Engineering Bootcamp follows this order. Module 2 covers machine learning, Module 3 covers neural networks, and Module 4 opens with a lesson on what generative AI is before going inside the Transformer.",
        ],
      },
    ],
    faqs: [
      ['Is deep learning a part of machine learning?', 'Yes. Deep learning is the branch of machine learning that uses neural networks with many layers. All deep learning is machine learning, but not all machine learning is deep learning.'],
      ['Is generative AI a type of deep learning?', 'Yes. Modern generative models, including large language models and image generators, are deep neural networks. Generative AI describes what the model produces, not a separate technique.'],
      ['Do I need machine learning to learn generative AI?', 'You need the basics. Ideas such as training, loss and overfitting come from machine learning, and generative models rely on them. A few weeks of foundations is enough to start.'],
      ['What is the difference between AI and generative AI?', 'AI is the whole field of systems that perform intelligent tasks. Generative AI is the part of it that creates new content such as text, images or code.'],
    ],
    links: [
      ['/lesson/machine-learning', 'Lesson: Machine Learning from First Principles'],
      ['/lesson/what-is-generative-ai', 'Lesson: Generative AI: Creating Instead of Classifying'],
      ['/module/deep-learning', 'Module 3: Neural Architectures Deep Dive'],
      ['/lesson/diffusion-models', 'Lesson: Diffusion Models'],
      ['/blog/deep-learning-explained-for-beginners', 'Deep learning explained for beginners'],
    ],
  },
  {
    slug: 'how-to-learn-machine-learning-from-scratch',
    title: 'How to Learn Machine Learning from Scratch: A Beginner Path',
    description: "How to learn machine learning from scratch: the math you need, the concepts to study in order, projects to build, and the mistakes beginners should avoid.",
    date: '2026-09-23',
    minutes: 8,
    keywords: ['how to learn machine learning', 'learn machine learning from scratch', 'machine learning for beginners', 'machine learning roadmap', 'machine learning course for beginners', 'how to start machine learning'],
    intro: [
      "To learn machine learning from scratch, follow four stages. Learn basic Python. Learn the core ideas with one simple model, linear regression. Add the concepts that apply to every model: loss, overfitting, regularization and evaluation. Then practise on small datasets until you can train, measure and improve a model without a guide.",
      "You do not need advanced math to begin, and you do not need to start with neural networks. This article lays out the path.",
    ],
    sections: [
      {
        h: 'What is machine learning, in one paragraph?',
        body: [
          "Machine learning is a way of getting a computer to do a task by showing it examples instead of writing rules. You give it inputs together with the right outputs. It adjusts its internal numbers, called parameters or weights, until its own outputs are close to the right ones. After that it can make predictions on inputs it has never seen. The whole subject is about doing this well: choosing the model, measuring the error, and making sure the model has learned the pattern and not just memorised the examples.",
        ],
      },
      {
        h: 'What should you know before learning machine learning?',
        body: [
          "Two things are enough to begin.",
          "Python basics. Variables, lists, dictionaries, loops, functions and reading a file. You do not need every corner of the language. Stop when you can write a short script without looking everything up.",
          "School-level math. You should know what a straight line equation looks like, what a slope means and what an average is. The rest you can learn when it comes up. Vectors and matrices appear when you handle many features at once. Derivatives appear with gradient descent. Probability appears with classification. Learning each piece next to the idea that uses it works better than a long math course up front.",
        ],
      },
      {
        h: 'A step-by-step path to learn machine learning',
        body: [
          "Work through these in order. Each one is small.",
        ],
        steps: [
          "Understand the setup: features, labels, a model, parameters, training and prediction.",
          "Learn the kinds of learning: supervised, unsupervised and reinforcement learning, and which problems each fits.",
          "Learn linear regression. Fit a line to points by hand with a small example, then in code.",
          "Learn the loss function: how the model measures its error, and how L1 and L2 loss differ.",
          "Learn gradient descent: how the model lowers the loss step by step.",
          "Learn logistic regression for yes-or-no problems, and how probabilities turn into decisions.",
          "Learn to split data into training, validation and test sets, and why you must never judge a model on data it trained on.",
          "Learn overfitting and underfitting, and how regularization keeps a model from memorising.",
          "Learn evaluation metrics: accuracy, precision, recall, and when accuracy misleads you.",
          "Learn feature engineering: turning raw data into inputs a model can use.",
        ],
      },
      {
        h: 'Why start with linear regression?',
        body: [
          "Linear regression is the smallest complete example of machine learning. It has a model, parameters, a loss and a training process. All of it fits on one page and you can check every number with a calculator.",
          "Everything bigger reuses the same parts. A neural network is many simple units stacked together, trained with the same idea of lowering a loss by following a slope. If linear regression is clear to you, deep learning becomes a matter of scale and not a new subject.",
          "Beginners who skip it and go straight to large networks often end up able to run code they cannot explain.",
        ],
      },
      {
        h: 'What projects should a beginner build?',
        body: [
          "Pick small, well-known problems first. The goal is to practise the full loop: load data, split it, train, measure, improve.",
        ],
        list: [
          "Predict a number from a table, such as a house price from its size and location.",
          "Classify something into two groups, such as spam or not spam, and report precision and recall, not only accuracy.",
          "Take one of those projects and deliberately overfit it. Then fix it with regularization and watch the test score change.",
          "Group unlabeled data into clusters and describe what each cluster seems to mean.",
        ],
      },
      {
        h: 'Mistakes beginners make when learning machine learning',
        body: [
          "Knowing these early saves a lot of time.",
        ],
        list: [
          "Trying to finish all the math first. Motivation runs out before the first model.",
          "Jumping straight to deep learning. The foundations are shorter and make it easier.",
          "Judging a model on its training data. Always keep a test set aside.",
          "Trusting accuracy on unbalanced data. If almost every example belongs to one class, a model that always guesses that class looks accurate and is useless.",
          "Copying notebooks without changing them. Change one thing, predict what will happen, and check.",
          "Reading without recall. After each topic, explain it aloud without notes.",
        ],
      },
      {
        h: 'How long does it take to learn machine learning?',
        body: [
          "The core concepts in this article take a few weeks of steady study for someone who already programs. Becoming comfortable enough to handle a new dataset alone takes longer and comes from practice. People who promise mastery in a weekend are selling something.",
          "A useful measure of progress is not hours spent. It is whether you can take a dataset you have never seen, train a sensible first model, and explain what its errors mean.",
        ],
      },
      {
        h: 'Where to go after the basics',
        body: [
          "Once the basics feel solid, move to neural networks: gradient descent in more detail, backpropagation, cross-entropy loss, dropout and normalization. From there the Transformer and large language models are within reach.",
          "On this site, Module 2, Learning from Data, covers the path in this article in nine lessons. Module 3 continues with neural networks. Both are part of the ML and Deep Learning track and of the Complete AI Engineer track.",
        ],
      },
    ],
    faqs: [
      ['Can I learn machine learning without a math background?', 'Yes. You need school-level math to begin. Vectors, derivatives and probability can be learned alongside the concepts that use them, with small worked examples.'],
      ['Should I learn Python before machine learning?', 'Yes, learn the basics first. Functions, loops, lists and dictionaries are enough. You will pick up the data libraries as you use them.'],
      ['Is machine learning hard to learn?', 'The ideas are approachable when taken in order. It feels hard when people skip the foundations or try to learn everything at once. One small concept at a time works.'],
      ['Should I learn machine learning or deep learning first?', 'Machine learning first. Deep learning uses the same ideas of loss, training and overfitting, so the basics make it much easier to follow.'],
      ['Can I learn machine learning on my own?', 'Yes. Many people do. A structured path helps you avoid gaps, and regular small projects make the knowledge stick.'],
    ],
    links: [
      ['/module/ml-foundations', 'Module 2: Learning from Data'],
      ['/lesson/machine-learning', 'Lesson: Machine Learning from First Principles'],
      ['/lesson/linear-regression-vs-logistic-regression', 'Lesson: Predicting Numbers vs Categories: Regression Compared'],
      ['/lesson/regularization-in-machine-learning', 'Lesson: Regularization: Stopping Overfitting with L1 and L2'],
      ['/practice', 'Practise what you learn'],
    ],
  },
  {
    slug: 'deep-learning-explained-for-beginners',
    title: 'Deep Learning Explained: Neural Networks to Transformers',
    description: "Deep learning explained for beginners: what a neural network is, how it learns with backpropagation, and how the field moved from RNNs to Transformers.",
    date: '2026-09-21',
    minutes: 8,
    keywords: ['deep learning explained', 'deep learning for beginners', 'what is deep learning', 'neural networks explained', 'how do neural networks learn', 'deep learning course', 'transformer explained'],
    intro: [
      "Deep learning is a way of teaching computers with neural networks that have many layers. Each layer takes numbers in, transforms them and passes them on. The network learns by comparing its output with the right answer and adjusting its internal numbers a little, over and over, until the error is small.",
      "This article walks from a single neuron to the Transformer, the design behind modern language models. No advanced math is needed to follow it.",
    ],
    sections: [
      {
        h: 'What is a neural network?',
        body: [
          "Start with one neuron. It receives a few numbers as input. It multiplies each one by a weight, adds them up, and adds one more number called the bias. Then it passes the total through a simple function called an activation, which decides how strongly the neuron fires.",
          "The weights say how much each input matters. The bias shifts the result up or down, so the neuron can fire even when the inputs are small. The activation adds a bend. Without that bend, any stack of layers would behave like a single straight-line model, however many layers it had.",
          "A layer is many neurons side by side. A network is many layers in a row. The word deep only means there are many layers.",
        ],
      },
      {
        h: 'How does a neural network learn?',
        body: [
          "Learning happens in a loop with four parts.",
        ],
        steps: [
          "Forward pass. The input flows through the layers and the network produces a prediction.",
          "Loss. A loss function turns the difference between the prediction and the right answer into a single number. For classification the usual choice is cross-entropy loss.",
          "Backpropagation. The network works out how much each weight contributed to the error, moving backwards from the output to the input.",
          "Update. Gradient descent changes every weight a little in the direction that lowers the loss. The size of the change is set by the learning rate.",
        ],
      },
      {
        h: 'What are gradient descent and backpropagation?',
        body: [
          "Picture the loss as a hilly landscape. Every possible setting of the weights is a place on it, and the height is the error. Training means walking downhill. Gradient descent looks at the slope where you stand and takes a step in the steepest downward direction.",
          "Backpropagation is how the slope is calculated. A network has a huge number of weights, and you need to know how the error changes with each one. Backpropagation uses the chain rule from calculus to pass the error backwards layer by layer, reusing work as it goes, so the whole calculation is fast.",
          "People often mix the two up. Backpropagation computes the slopes. Gradient descent uses them to update the weights.",
        ],
      },
      {
        h: 'Why do deep networks need dropout and normalization?',
        body: [
          "Two problems appear as networks grow.",
          "The first is overfitting. A large network can memorise its training data and then fail on new data. Dropout fights this by switching off a random share of neurons during each training step. The network cannot lean on any single neuron, so it learns patterns that hold more widely.",
          "The second is unstable training. As numbers pass through many layers they can grow very large or shrink towards zero, and learning slows or breaks. Normalization layers keep the numbers in a steady range. Batch normalization does this across a batch of examples. Layer normalization does it within one example, which suits language models, and newer models often use a lighter version called RMSNorm.",
        ],
      },
      {
        h: 'From feed-forward networks to CNNs and RNNs',
        body: [
          "The plain network described so far is called a feed-forward network. It treats its input as one flat list of numbers. That works for tables, but it wastes the structure in images and text.",
          "Convolutional neural networks, or CNNs, were designed for images. They slide small filters across the picture, so the same pattern detector is reused everywhere. They became the standard for computer vision.",
          "Recurrent neural networks, or RNNs, were designed for sequences such as sentences. An RNN reads one item at a time and carries a hidden state forward as its memory of what came before. This fits language naturally, but it has two weaknesses. It must process tokens one after another, which is slow. And information from far back in the sequence fades by the time it is needed.",
        ],
      },
      {
        h: 'What is a Transformer and why did it replace RNNs?',
        body: [
          "The Transformer removed the step-by-step reading. Instead of passing a memory along the sequence, it lets every token look directly at every other token. This mechanism is called self-attention.",
          "For each token, attention asks which other tokens are relevant right now and by how much, then blends their information in. A word at the end of a paragraph can use a word from the start in a single step. Nothing has to survive a long chain.",
          "Because all tokens are processed together, training can run in parallel on GPUs. That made it practical to train on far more text than before, and it is the main reason large language models became possible. The same design now handles images too, by cutting a picture into patches and treating the patches as tokens.",
        ],
      },
      {
        h: 'How do you learn deep learning as a beginner?',
        body: [
          "Follow the order of this article. Begin with a single neuron and what the bias does. Work through gradient descent with small numbers. Follow one full example of backpropagation by hand. Then learn cross-entropy loss, dropout and normalization. After that, study RNNs briefly, so you see the problem that attention solves, and move on to the Transformer.",
          "A little hands-on work helps a great deal. Build a tiny network in PyTorch, train it, and watch the loss fall. Then change the learning rate and see what breaks.",
          "Module 3 of the AI Engineering Bootcamp teaches these topics in ten lessons, and Module 4 goes inside the Transformer piece by piece.",
        ],
      },
    ],
    faqs: [
      ['What is the difference between a neural network and deep learning?', 'A neural network is the model. Deep learning is the practice of training neural networks with many layers. A network with only one or two layers is usually not called deep.'],
      ['Do I need calculus to understand deep learning?', 'You need the idea of a slope and the chain rule. Both can be learned with small worked examples. You do not need a full calculus course before you start.'],
      ['What is backpropagation in simple terms?', 'It is the method a network uses to find out how much each weight contributed to its error. It passes the error backwards from the output so that every weight can be adjusted.'],
      ['Are Transformers a type of deep learning?', 'Yes. A Transformer is a deep neural network built around attention layers. It is trained with the same loop of loss, backpropagation and gradient descent as other networks.'],
    ],
    links: [
      ['/module/deep-learning', 'Module 3: Neural Architectures Deep Dive'],
      ['/lesson/math-behind-backpropagation', 'Lesson: Backpropagation: How Neural Networks Learn from Mistakes'],
      ['/lesson/math-behind-gradient-descent', 'Lesson: Gradient Descent: Rolling Downhill to the Optimum'],
      ['/lesson/how-do-rnns-and-transformers-differ', 'Lesson: RNNs vs Transformers: A Fundamental Architecture Shift'],
      ['/blog/how-llms-work', 'How LLMs work: tokens, embeddings and attention'],
    ],
  },
  {
    slug: 'ai-engineer-skills',
    title: 'AI Engineer Skills: What to Learn and in What Order',
    description: "The skills every AI engineer needs, grouped into six areas, with the order to learn them and a simple way to check whether you really know each one.",
    date: '2026-09-18',
    minutes: 7,
    keywords: ['ai engineer skills', 'skills required for ai engineer', 'ai engineering skills', 'what skills does an ai engineer need', 'ai engineer requirements', 'generative ai skills', 'llm engineer skills'],
    intro: [
      "An AI engineer needs skills in six areas: software engineering, machine learning foundations, how LLMs work inside, building with LLMs through prompting, RAG and agents, running models in production, and judgment about quality and safety. Learn them roughly in that order, because each area leans on the one before it.",
      "Below is what each area contains, why it matters, and how to tell whether you have it.",
    ],
    sections: [
      {
        h: '1. Software engineering skills',
        body: [
          "AI engineering is software engineering with a model in the middle. If the code around the model is weak, the product will be weak whatever model you use.",
        ],
        list: [
          "Python, written clearly, with functions and types you can test.",
          "Working with APIs: sending requests, handling errors, retries and timeouts.",
          "Data handling: reading files, cleaning text, working with JSON.",
          "Version control and basic testing.",
          "How the web carries a response: HTTP, streaming with server-sent events and WebSockets.",
        ],
      },
      {
        h: '2. Machine learning and deep learning foundations',
        body: [
          "You do not need to be a researcher. You need enough to reason about a model instead of guessing.",
          "The essentials are how a model learns from data, what a loss function is, what overfitting looks like, how regularization helps, and how to choose a metric such as precision or recall. For deep learning, add neural networks, gradient descent, backpropagation and normalization.",
          "These ideas come back constantly. Evaluating a retrieval system is a precision and recall problem. Fine-tuning is gradient descent on a smaller dataset. An AI engineer without these foundations can follow a tutorial but struggles when something new goes wrong.",
        ],
      },
      {
        h: '3. How LLMs work inside',
        body: [
          "This is the skill that separates someone who uses a model from someone who understands it.",
        ],
        list: [
          "Tokenization: how text becomes tokens, and why token counts drive cost and limits.",
          "Embeddings: how meaning is stored as vectors.",
          "Attention and the Transformer: how tokens use each other as context.",
          "Generation: next-token prediction, temperature, top-k and top-p sampling.",
          "The context window, and why information in the middle of a long input can be missed.",
          "Model types: small models, reasoning models, and when each fits.",
        ],
      },
      {
        h: '4. Building with LLMs: prompting, RAG and agents',
        body: [
          "This is the daily work of most AI engineers.",
          "Prompting and context engineering come first. You decide what instructions and information the model sees, in what order, and how to keep the context short enough to stay useful. Techniques include chain-of-thought prompting, prompt chaining and prompt caching.",
          "RAG gives the model knowledge it was not trained on. The skills are chunking documents, creating embeddings, storing them in a vector database, combining keyword and semantic search, and reranking the results.",
          "Agents let the model act. The skills are function calling, writing a dependable agent loop, planning, memory, and connecting tools through a standard such as the Model Context Protocol. You should also know when not to use an agent. A fixed sequence of steps is often cheaper and more predictable.",
          "Fine-tuning belongs here as well. Know what it changes, how LoRA makes it affordable, and when a better prompt or retrieval would solve the problem instead.",
        ],
      },
      {
        h: '5. Production skills: evaluation, inference and safety',
        body: [
          "A demo works once. A product has to work every day, for many users, at a cost the business accepts.",
        ],
        list: [
          "Evaluation: building test sets, using a model as a judge with care, and measuring agents across many steps.",
          "Observability: traces and logs that show what happened inside a request.",
          "Inference: the KV cache, batching, quantization and the serving engines that use them.",
          "Cost control: caching, routing easy requests to smaller models.",
          "Safety: guardrails on inputs and outputs, and defences against prompt injection.",
          "System design: putting all the parts together and explaining the trade-offs.",
        ],
      },
      {
        h: '6. Judgment and communication',
        body: [
          "The last skill area is less technical and just as important. An AI engineer decides whether a feature needs a model at all, how good is good enough, and what should happen when the model is wrong. They explain an uncertain system to people who expect software to be exact.",
          "A habit worth building early is defining done before you start. Write down what a correct result looks like and how you will check it. This one habit improves prompts, agents and evaluations alike.",
        ],
      },
      {
        h: 'In what order should you learn AI engineer skills?',
        body: [
          "Use this sequence. Move on when you can explain the current step to someone else without notes.",
        ],
        steps: [
          "Python and basic software practice.",
          "Machine learning basics.",
          "Neural networks and how they train.",
          "Tokens, embeddings, attention and the Transformer.",
          "How generation and sampling work.",
          "Prompting and context engineering.",
          "RAG.",
          "Agents and tools.",
          "Fine-tuning.",
          "Evaluation, safety, inference and system design.",
        ],
      },
      {
        h: 'How do you know you have a skill?',
        body: [
          "Use three checks for each topic. Can you explain why it exists, meaning the problem it solves? Can you describe how it works step by step, with a small example? Can you say when not to use it?",
          "If you can do all three for RAG, for agents and for attention, you are in good shape for real work. The course on this site is built around the same three questions, and every lesson ends with a short quiz so you can test yourself.",
        ],
      },
    ],
    faqs: [
      ['What skills are required to be an AI engineer?', 'Software engineering, machine learning foundations, an understanding of how LLMs work, and the ability to build with them using prompting, RAG and agents. Production skills such as evaluation, serving and safety complete the set.'],
      ['Do AI engineers need to know math?', 'Some. Vectors, matrices, slopes and basic probability cover most of what the work needs. Deep research math is not required for building products.'],
      ['Is Python enough for AI engineering?', 'Python is the main language and enough to learn everything. For shipping web products you may also need JavaScript or TypeScript, and some general backend knowledge.'],
      ['Which AI engineer skill should I learn first?', 'Programming, then machine learning basics. Everything else, from Transformers to agents, is easier once you understand how a model learns and how to measure it.'],
    ],
    links: [
      ['/ai-engineer-roadmap', 'AI engineer roadmap: what to learn, in order'],
      ['/lesson/context-engineering', "Lesson: Context Engineering: Curating the Model's Working Memory"],
      ['/module/evaluation', 'Module 14: Measuring What Matters'],
      ['/lesson/ai-is-only-as-good-as-our-definition-of-done', 'Lesson: Defining Done: Why Exit Criteria Shape Agent Quality'],
      ['/blog/how-to-become-an-ai-engineer', 'How to become an AI engineer'],
    ],
  },
  {
    slug: 'rag-vs-fine-tuning-vs-prompt-engineering',
    title: 'RAG vs Fine-Tuning vs Prompt Engineering: Which to Use When',
    description: "RAG vs fine-tuning vs prompt engineering: what each one changes, what it costs, a simple way to choose between them, and how to combine all three.",
    date: '2026-10-04',
    minutes: 7,
    keywords: ['rag vs fine-tuning', 'rag vs fine tuning vs prompt engineering', 'fine-tuning vs prompt engineering', 'when to use rag', 'when to fine-tune an llm', 'what is rag', 'retrieval augmented generation'],
    intro: [
      "Use prompt engineering first. Add RAG when the model lacks knowledge, such as your documents or recent facts. Use fine-tuning when the model lacks a behaviour, such as a fixed style or format, and a prompt cannot get it there reliably. The three are not competitors. They change different things, and many products use all of them.",
      "The quick test is to ask what is missing. If the model does not know something, that is a knowledge problem and RAG fits. If the model knows enough but does not act the way you need, that is a behaviour problem, and prompting or fine-tuning fits.",
    ],
    sections: [
      {
        h: 'What is prompt engineering?',
        body: [
          "Prompt engineering means changing what you send to the model. You write clear instructions, give examples of good answers, set a format, and break a hard task into steps. The model itself does not change.",
          "It is the fastest and cheapest of the three. You can try an idea in minutes. It is also the most limited. A prompt cannot give the model facts it never saw unless you paste those facts in, and every word you add is paid for on every request.",
          "Today the term context engineering is often used for the wider job: deciding everything that goes into the context window, including instructions, retrieved documents, tool results and conversation history.",
        ],
      },
      {
        h: 'What is RAG (retrieval-augmented generation)?',
        body: [
          "RAG adds a search step before the model answers. Your documents are split into chunks, and each chunk is turned into an embedding and stored. When a question arrives, the system finds the chunks most related to it and places them in the prompt. The model then answers from that text.",
          "RAG suits knowledge that is private, large or changing. To update what the system knows, you update the documents. No training is needed. It also lets you show sources, so a user can check where an answer came from.",
          "Its weak point is retrieval quality. If the right chunk is not found, the model cannot use it. Most of the work in a RAG system goes into chunking, search and reranking, not into the model call.",
        ],
      },
      {
        h: 'What is fine-tuning?',
        body: [
          "Fine-tuning continues training a pre-trained model on your own examples, so its weights change. After fine-tuning, the model behaves differently without being told to in the prompt.",
          "It works well for behaviour: a consistent tone, a strict output format, a narrow task done the same way every time, or making a small model good at one job so you can stop paying for a large one. Methods such as LoRA train only a small set of extra weights, which makes fine-tuning much cheaper than updating the whole model.",
          "It is a poor way to add facts. Facts trained into weights are hard to update and hard to trace, and the model can still state them wrongly. It also needs a set of good examples, time to train and a way to measure whether the result is better.",
        ],
      },
      {
        h: 'RAG vs fine-tuning vs prompt engineering: comparison table',
        body: [
          "The table sums up the practical differences.",
        ],
        table: {
          head: ['', 'Prompt engineering', 'RAG', 'Fine-tuning'],
          rows: [
            ['What changes', 'The input', 'The input, with retrieved text', 'The model weights'],
            ['Best for', 'Instructions, format, simple tasks', 'Private or changing knowledge', 'Consistent behaviour and style'],
            ['Adds new facts', 'Only what you paste in', 'Yes, from your documents', 'Poorly'],
            ['Effort to start', 'Low', 'Medium', 'High'],
            ['Updating', 'Edit the prompt', 'Update the documents', 'Train again'],
            ['Can cite sources', 'No', 'Yes', 'No'],
            ['Main risk', 'Long, fragile prompts', 'Poor retrieval', 'Bad or too little training data'],
          ],
        },
      },
      {
        h: 'How do you choose between them?',
        body: [
          "Go through these steps in order and stop as soon as the result is good enough.",
        ],
        steps: [
          "Write a clear prompt with a few examples and test it on real inputs. Many problems end here.",
          "Look at the failures. If the model lacks facts, or the facts change, add RAG.",
          "If answers are still wrong, check retrieval before blaming the model. Is the right chunk being found?",
          "If the model has the facts but the style, format or reasoning is still inconsistent, collect examples of ideal outputs and consider fine-tuning.",
          "Whatever you choose, build an evaluation set first, so you can tell whether each change helped.",
        ],
      },
      {
        h: 'When should you combine RAG and fine-tuning?',
        body: [
          "Combining them is common, because they solve different problems. A support assistant might use RAG to pull the current help articles, a fine-tuned model to answer in the company voice and always return the same structure, and a prompt that sets the rules for the conversation.",
          "A sensible order is to get prompting and RAG working first. Add fine-tuning only when you can point to a clear, repeated failure that the first two do not fix. Fine-tuning before that often means paying for training to solve a problem that a better prompt or better retrieval would have solved.",
        ],
      },
      {
        h: 'Common mistakes',
        body: [
          "A few errors come up again and again.",
        ],
        list: [
          "Fine-tuning to teach facts. Use retrieval for facts.",
          "Blaming the model for a retrieval failure. Read what was actually retrieved.",
          "Stuffing everything into the prompt. Long contexts cost more, and details in the middle are easier for the model to miss.",
          "Chunking documents without thought. Chunks that cut a table or a sentence in half lose meaning.",
          "Skipping evaluation. Without a test set you cannot compare the three approaches fairly.",
        ],
      },
    ],
    faqs: [
      ['Is RAG better than fine-tuning?', 'Neither is better in general. RAG is better for adding knowledge that is private or changes often. Fine-tuning is better for changing how the model behaves. Many systems use both.'],
      ['Does RAG stop hallucinations?', 'It reduces them when the right documents are retrieved, because the model can answer from text in front of it. It does not remove them. Poor retrieval or unclear sources still lead to wrong answers.'],
      ['Can prompt engineering replace fine-tuning?', 'Often, yes. A clear prompt with good examples solves many tasks. Fine-tuning becomes worth it when you need consistent behaviour at scale that prompts cannot hold.'],
      ['Is fine-tuning expensive?', 'It costs more than prompting, because you need training data, compute and evaluation. Methods such as LoRA lower the cost a lot by training only a small number of extra weights.'],
      ['Do I need a vector database for RAG?', 'Usually, but not always. Vector search is the common choice. Keyword search, hybrid search and approaches without embeddings can also retrieve the right text, depending on the data.'],
    ],
    links: [
      ['/module/rag', 'Module 10: Building RAG Systems'],
      ['/lesson/how-does-fine-tuning-work', 'Lesson: Fine-Tuning: Adapting a Pre-Trained Model to Your Task'],
      ['/lesson/lora-low-rank-adaptation-of-llms', 'Lesson: LoRA: Parameter-Efficient Fine-Tuning via Low-Rank Matrices'],
      ['/lesson/chunking-strategies-for-rag', 'Lesson: Document Chunking Strategies for RAG'],
      ['/lesson/context-engineering', "Lesson: Context Engineering: Curating the Model's Working Memory"],
    ],
  },
  {
    slug: 'what-are-ai-agents',
    title: 'What Are AI Agents and How Do You Build One? A Clear Guide',
    description: "What AI agents are, how the agent loop works, the parts every agent needs (model, tools, memory, planning), and the steps to build a simple one yourself.",
    date: '2026-09-30',
    minutes: 8,
    keywords: ['what are ai agents', 'how to build an ai agent', 'ai agents explained', 'agentic ai', 'ai agent vs chatbot', 'ai agent architecture', 'what is an ai agent'],
    intro: [
      "An AI agent is a program in which a language model decides what to do next, takes an action through a tool, looks at the result, and repeats until the task is finished. A chatbot answers a message. An agent works towards a goal over several steps.",
      "To build one you need four things: a model, a set of tools, a loop that connects them, and a clear rule for when to stop. This guide explains each part and the order to build them in.",
    ],
    sections: [
      {
        h: 'What is an AI agent in simple terms?',
        body: [
          "A plain LLM call is one question and one answer. The model cannot check a fact, read a file or run code. It can only write text.",
          "An agent wraps the model in a loop and gives it tools. Suppose you ask an agent to find out why a test is failing. It reads the test file, runs the test, reads the error, opens the function the error points to, proposes a fix, runs the test again and reports back. At each step the model chose the next action based on what it had just seen.",
          "That choice is the defining feature. In an ordinary program the developer fixes the order of steps in code. In an agent the model decides the order while it runs.",
        ],
      },
      {
        h: 'How does the agent loop work?',
        body: [
          "Almost every agent follows the same cycle.",
        ],
        steps: [
          "Observe. The agent gathers what it knows: the goal, the conversation so far and the results of earlier actions.",
          "Think. The model reasons about what to do next.",
          "Act. The model asks for a tool to be called with specific arguments. The program runs the tool.",
          "Read the result. The tool output is added to the context.",
          "Repeat, or stop when the goal is met or a limit is reached.",
        ],
      },
      {
        h: 'What are the parts of an AI agent?',
        body: [
          "Agents are built from a small set of parts.",
        ],
        table: {
          head: ['Part', 'Role'],
          rows: [
            ['Model', 'Does the reasoning and chooses each action.'],
            ['Tools', 'Functions the agent can call: search, read a file, query a database, send a request.'],
            ['Loop', 'Code that runs the model, executes tool calls and feeds results back.'],
            ['Memory', 'Short-term memory is the context window. Long-term memory is stored outside and looked up when needed.'],
            ['Planning', 'Breaking a goal into steps, before starting or along the way.'],
            ['Stop condition', 'A definition of done, plus limits on steps, time and cost.'],
          ],
        },
      },
      {
        h: 'How do tools and function calling work?',
        body: [
          "The model cannot run code itself. Function calling is the bridge. You describe each tool to the model: its name, what it does and what arguments it takes. When the model wants to use one, it outputs a structured request naming the tool and the arguments. Your program runs the real function and sends the result back as text.",
          "Tool descriptions matter more than people expect. The model chooses tools by reading them, so a vague description leads to wrong choices. Keep each tool narrow, name it clearly and return errors the model can understand.",
          "The Model Context Protocol, or MCP, is a standard way to expose tools so that different agents and applications can use the same ones without custom glue for each pair.",
        ],
      },
      {
        h: 'Common agent patterns: ReAct, plan-and-execute, reflection',
        body: [
          "A few designs appear in most agent systems.",
          "ReAct alternates reasoning and acting. The model writes a short thought, calls a tool, reads the result and thinks again. It is simple and adapts well when the path is not known in advance.",
          "Plan-and-execute splits the job in two. First the model writes a full plan. Then it carries out the steps one at a time. This suits longer tasks where a clear structure helps.",
          "Reflection adds a review step. The agent checks its own output against the goal and revises it. This raises quality and costs extra model calls.",
          "Multi-agent systems divide work among several agents with different roles, for example one that researches and one that writes. They help with large tasks, but they add coordination problems. Start with one agent.",
        ],
      },
      {
        h: 'How to build an AI agent step by step',
        body: [
          "Build the smallest version first and add parts only when you need them.",
        ],
        steps: [
          "Pick one narrow task with a clear finish, such as answering questions from a folder of files.",
          "Write down what done means and how you will check it.",
          "Define two or three tools with precise descriptions.",
          "Write the loop yourself: call the model, run any tool it asks for, append the result, repeat.",
          "Add limits: a maximum number of steps, and timeouts on tools.",
          "Log every step, so you can read exactly what the agent did.",
          "Test on a fixed set of tasks and study the failures.",
          "Only then add memory, planning or a framework, if the failures show you need them.",
        ],
      },
      {
        h: 'Should you use a framework such as LangChain or LangGraph?',
        body: [
          "Frameworks save time on common pieces: tool wiring, state, retries and tracing. They are useful once you know what you are building.",
          "Write a plain loop once before you reach for one. It is a small amount of code, and it shows you what the framework does for you. After that you can read framework code and debug it, instead of treating it as magic.",
        ],
      },
      {
        h: 'Why do AI agents fail?',
        body: [
          "Agents fail in ways a single model call does not. Knowing the usual causes helps you design against them.",
        ],
        list: [
          "Errors add up. A small mistake at step two shapes every later step.",
          "Loops. The agent repeats the same action without progress. A step limit is essential.",
          "Context overload. Long runs fill the context window, and early instructions get lost.",
          "Unclear stop rule. The agent stops too early or never stops.",
          "Unsafe actions. Text from a web page or document can contain instructions that hijack the agent. This is called prompt injection, and tools that change things need extra checks.",
          "No evaluation. Without a test set and traces, you cannot tell whether a change made the agent better.",
        ],
      },
    ],
    faqs: [
      ['What is the difference between an AI agent and a chatbot?', 'A chatbot replies to a message with text. An agent pursues a goal across several steps, choosing and using tools along the way and checking the results.'],
      ['What is agentic AI?', 'Agentic AI is a general term for systems in which a model plans and takes actions with some independence, instead of only producing a single reply. AI agents are the main example.'],
      ['Do I need a framework to build an AI agent?', 'No. A basic agent is a loop around a model call with a few tools. Frameworks help with larger systems, but building one by hand first teaches you how they work.'],
      ['Which model should I use for an agent?', 'Use one that supports function calling and follows instructions well. Test a few on your own tasks. Stronger models make fewer mistakes over long runs, and smaller ones cost less for simple steps.'],
    ],
    links: [
      ['/module/agents', 'Module 11: Autonomous AI Agents'],
      ['/lesson/ai-agent-loop', 'Lesson: The Agent Loop: Observe, Think, Act, Repeat'],
      ['/lesson/how-does-function-calling-work-in-llms', 'Lesson: Function Calling: Giving LLMs Tools to Act on the World'],
      ['/lesson/what-is-mcp-model-context-protocol', 'Lesson: Model Context Protocol: A Standard Interface for Agent Tools'],
      ['/lesson/prompt-injection-in-llms', 'Lesson: Prompt Injection: Attacks Against LLM-Powered Systems'],
    ],
  },
  {
    slug: 'ai-engineer-interview-questions',
    title: 'AI Engineer Interview Questions and How to Prepare for Them',
    description: "Common AI engineer interview questions on LLMs, RAG, agents, evaluation and system design, with what interviewers look for and a plan to prepare.",
    date: '2026-09-25',
    minutes: 8,
    keywords: ['ai engineer interview questions', 'ai engineering interview', 'llm interview questions', 'generative ai interview questions', 'rag interview questions', 'ai system design interview', 'how to prepare for ai engineer interview'],
    intro: [
      "AI engineer interviews usually cover five areas: model fundamentals, building with LLMs, evaluation, production concerns and system design. Many also include a coding round and a conversation about a project you built. Interviewers want to see that you can explain why a system behaves as it does and that you can reason about trade-offs.",
      "This article lists the kinds of questions that come up in each area, what a good answer contains, and how to prepare. Every company is different, so treat it as a study map and not a script.",
    ],
    sections: [
      {
        h: 'What do AI engineer interviews test?',
        body: [
          "The role sits between machine learning and software engineering, and the interview reflects that. You can expect some mix of the rounds below.",
        ],
        list: [
          "Fundamentals: how models learn and how LLMs work inside.",
          "Applied LLM work: prompting, RAG, agents and fine-tuning.",
          "Evaluation and debugging: how you know a system is good, and what you do when it is not.",
          "System design: sketching a complete AI product and defending the choices.",
          "Coding: general programming, sometimes with a small LLM task.",
          "Project discussion: a deep conversation about something you built.",
        ],
      },
      {
        h: 'Machine learning and LLM fundamentals questions',
        body: [
          "These often open the interview. They check that your knowledge goes below the API.",
        ],
        list: [
          "What is overfitting, and how do you reduce it?",
          "When would you prefer precision over recall?",
          "How does gradient descent work? What does backpropagation compute?",
          "What is a token? Why do models use subword tokens instead of whole words?",
          "What is an embedding, and what does it mean for two embeddings to be close?",
          "Explain self-attention in simple terms. Why did Transformers replace RNNs?",
          "What does temperature do? What is the difference between top-k and top-p sampling?",
          "What is the context window, and what happens to cost and quality as it fills up?",
          "What is the KV cache, and why does it speed up generation?",
        ],
      },
      {
        h: 'RAG interview questions',
        body: [
          "RAG is a favourite topic because it has many parts that can each go wrong.",
        ],
        list: [
          "Walk me through a RAG pipeline from document to answer.",
          "How do you choose a chunk size? What goes wrong if chunks are too large or too small?",
          "What is the difference between keyword search and semantic search? When would you use hybrid search?",
          "What does a reranker do, and where does it sit in the pipeline?",
          "The system retrieves the right document but the answer is still wrong. What do you check?",
          "How do you evaluate retrieval separately from generation?",
          "When would you choose fine-tuning instead of RAG?",
        ],
      },
      {
        h: 'AI agent interview questions',
        body: [
          "Agent questions test whether you understand the loop and its failure modes.",
        ],
        list: [
          "What is the difference between an agent and a fixed workflow? When is an agent the wrong choice?",
          "How does function calling work?",
          "Describe the ReAct pattern. How does plan-and-execute differ?",
          "How do you stop an agent from looping forever?",
          "How would you give an agent memory across sessions?",
          "What is prompt injection, and how do you limit the damage it can do in an agent with tools?",
          "How do you evaluate an agent that takes many steps?",
        ],
      },
      {
        h: 'Evaluation and production questions',
        body: [
          "This is where experienced candidates stand out. Anyone can build a demo. Fewer people can say how they know it works.",
        ],
        list: [
          "How would you build an evaluation set for a new LLM feature?",
          "What are the risks of using an LLM as a judge, and how do you reduce them?",
          "Responses are too slow. Where do you look first?",
          "The bill is too high. What are your options?",
          "What is quantization, and what do you trade for the smaller size?",
          "How do you detect that quality dropped after a prompt or model change?",
          "What guardrails would you put around a customer-facing assistant?",
        ],
      },
      {
        h: 'How to answer AI system design questions',
        body: [
          "A typical prompt is to design a question-answering assistant over company documents, a support agent, or a real-time voice assistant. There is no single correct design. The interviewer is watching how you think.",
        ],
        steps: [
          "Ask questions first. Who are the users? How many requests? How fresh must the data be? What happens when the answer is wrong?",
          "State the requirements out loud: quality, response time, cost, safety.",
          "Sketch the simple version: input, retrieval or tools, model, output.",
          "Go through each part and name the choice you made and one alternative.",
          "Explain how you would evaluate it before launch and monitor it after.",
          "Cover failure: no relevant documents, tool errors, unsafe input, model outage.",
          "Finish with what you would improve if you had more time.",
        ],
      },
      {
        h: 'How to prepare for an AI engineer interview',
        body: [
          "Preparation works best when it is active. Reading lists of answers gives a false sense of readiness.",
        ],
        list: [
          "Rebuild the fundamentals in order: machine learning, neural networks, Transformers, generation. Explain each aloud without notes.",
          "Build one project end to end and know it deeply: why you chose each part, what failed, what you measured, what you would change.",
          "Write an evaluation set for that project. Being able to show numbers before and after a change is persuasive.",
          "Practise system design aloud with a timer. Draw the diagram as you talk.",
          "Prepare honest stories about a bug you tracked down and a trade-off you made.",
          "Say what you do not know. A clear statement of the limit of your knowledge, followed by how you would find out, is better than a guess.",
        ],
      },
      {
        h: 'How this course helps with interview preparation',
        body: [
          "The AI Engineering Bootcamp covers the topics in this article across its 19 modules, and Module 19 is dedicated to interview preparation, including a worked system-design answer. The practice area lets you test yourself, and each lesson quiz shows which topics need another pass.",
          "A course can help you understand the material and explain it clearly. It cannot guarantee an offer. That depends on the role, the company and your own preparation.",
        ],
      },
    ],
    faqs: [
      ['What questions are asked in an AI engineer interview?', 'Expect questions on LLM fundamentals, RAG, agents, evaluation and system design, along with coding and a discussion of your projects. The mix depends on the company and the level of the role.'],
      ['Do AI engineer interviews include coding?', 'Usually, yes. Many include a general coding round, and some add a practical task such as building a small retrieval or tool-calling feature.'],
      ['How do I prepare for an AI system design interview?', 'Practise designing common products such as a document assistant or a support agent. Clarify requirements, sketch a simple design, then discuss evaluation, cost, response time and failure cases.'],
      ['Do I need to know machine learning math for AI engineer interviews?', 'You should be able to explain gradient descent, loss functions and attention at a conceptual level, with simple examples. Heavy derivations are more common in research roles.'],
    ],
    links: [
      ['/lesson/ai-engineering-interview-prep', 'Lesson: Cracking the AI Engineering Interview'],
      ['/lesson/system-design', 'Lesson: System Design Fundamentals for AI Engineers'],
      ['/practice', 'Practise questions by topic'],
      ['/blog/rag-vs-fine-tuning-vs-prompt-engineering', 'RAG vs fine-tuning vs prompt engineering'],
      ['/lesson/llm-evaluation', 'Lesson: Evaluating LLMs: Metrics, Benchmarks, and Methods'],
    ],
  },
  {
    slug: 'how-llms-work',
    title: 'How LLMs Work: Tokens, Embeddings and Attention Explained',
    description: "How LLMs work in plain English: how text becomes tokens, tokens become embeddings, attention adds context, and the model writes one token at a time.",
    date: '2026-09-16',
    minutes: 8,
    keywords: ['how llms work', 'how do large language models work', 'what is a token in ai', 'what are embeddings', 'attention mechanism explained', 'how does chatgpt work', 'transformer explained simply'],
    intro: [
      "A large language model, or LLM, does one thing: it predicts the next piece of text. It reads what has been written so far, works out which piece is likely to come next, adds it, and repeats. A whole answer is built this way, one piece at a time.",
      "To make each prediction, the model takes four steps. It splits text into tokens. It turns tokens into lists of numbers called embeddings. It passes them through layers of attention, so each token can use the others as context. Then it produces a probability for every possible next token and picks one. This article explains each step.",
    ],
    sections: [
      {
        h: 'What is an LLM?',
        body: [
          "An LLM is a very large neural network trained on a huge amount of text. Large refers to the number of parameters, the adjustable numbers inside the network. Language model means it models which text tends to follow which.",
          "It is not a database of sentences and it does not look answers up. What it learned during training is stored as numbers in its weights. When you send a prompt, it calculates a response from those numbers.",
        ],
      },
      {
        h: 'What is a token?',
        body: [
          "A model cannot read letters. It works with numbers, so text is first cut into small pieces called tokens, and each token gets an ID number.",
          "A token is often a word, but not always. Common words tend to be one token. Rare or long words are split into several parts. Punctuation and spaces count too. This subword approach lets the model handle any text, including words it has never seen, with a vocabulary of fixed size. A common method for building the vocabulary is byte pair encoding, or BPE, which starts from small units and repeatedly merges the pairs that appear together most often.",
          "Tokens matter in practice. Model limits and prices are counted in tokens, not words. The context window, the amount of text a model can consider at once, is also measured in tokens.",
        ],
      },
      {
        h: 'What are embeddings?',
        body: [
          "A token ID is only a label. The number says nothing about meaning. So the model looks up each ID in a table and replaces it with an embedding, a long list of numbers.",
          "You can think of an embedding as a location in a space with many dimensions. During training, tokens used in similar ways end up near each other. Words for animals gather in one region, words for cities in another. Directions in the space carry meaning as well.",
          "The model also needs to know the order of the tokens, because the same words in a different order can mean something else. Position information is added to the embeddings so the model can tell first from last.",
          "Embeddings are useful outside the model too. Search systems and RAG use them to find text with a similar meaning, even when the wording is different.",
        ],
      },
      {
        h: 'What is attention and why does it matter?',
        body: [
          "An embedding gives a token one fixed meaning, but words depend on context. The word bank means one thing next to river and another next to loan. Attention is the mechanism that fixes this.",
          "In self-attention, each token looks at the other tokens and decides how relevant each one is to it. It then pulls in information from the relevant ones, weighted by that relevance. After this step, the vector for bank is no longer generic. It has been shaped by the words around it.",
          "The model does this with several attention heads at once. Each head can track a different kind of relationship, such as which noun a pronoun refers to, or which verb goes with which subject. This is called multi-head attention.",
          "In a model that generates text, a token may only look at tokens before it, never after. This rule is called causal masking. It matches how the model is used: when writing, the future does not exist yet.",
        ],
      },
      {
        h: 'What happens inside a Transformer layer?',
        body: [
          "The architecture that combines these ideas is the Transformer. It is a stack of identical layers, and each layer has two main parts.",
          "The first is attention, where tokens exchange information with each other. The second is a feed-forward network, which processes each token separately and holds much of what the model has learned.",
          "The token vectors pass through layer after layer. With each one they become richer. Early layers tend to capture simple things such as grammar. Later layers capture more abstract meaning. By the top of the stack, the vector at the last position holds what the model needs to predict what comes next.",
        ],
      },
      {
        h: 'How does an LLM generate text?',
        body: [
          "At the end of the stack the model produces a score for every token in its vocabulary. These scores are turned into probabilities. Then one token is chosen.",
          "How it is chosen is called sampling. Always taking the most likely token gives safe and repetitive text. Temperature controls how much the model favours likely tokens. A low temperature makes output focused and predictable. A high temperature makes it more varied. Top-k and top-p sampling cut off the unlikely tokens before choosing, so the model does not pick something absurd.",
          "The chosen token is added to the input and the whole process runs again for the next one. This is called autoregressive generation. It is why answers appear word by word on the screen, and why longer answers take longer.",
        ],
      },
      {
        h: 'How is an LLM trained?',
        body: [
          "Training uses the same task as generation. The model is shown text with the next token hidden and asked to predict it. Its prediction is compared with the real token, the error is measured with a loss function, and backpropagation adjusts the weights slightly. Repeated over an enormous amount of text, this teaches grammar, facts and patterns of reasoning, because all of them help predict what comes next.",
          "This first stage is called pre-training. Afterwards, models are usually trained further to follow instructions and to answer in ways people find helpful. Fine-tuning for a specific task is a smaller version of the same process.",
        ],
      },
      {
        h: 'What does this explain about LLM behaviour?',
        body: [
          "Once you know the mechanism, several familiar behaviours make sense.",
        ],
        list: [
          "Hallucinations. The model produces likely text. Likely is not the same as true, and nothing inside checks facts.",
          "Different answers to the same prompt. Sampling involves chance unless the temperature is very low.",
          "Knowledge cutoff. The weights hold only what was in the training data. Newer facts must be supplied in the prompt, for example through RAG.",
          "Limits on input length. Attention compares tokens with each other, so cost grows quickly as the context gets longer.",
          "Trouble with exact letters or counting. The model sees tokens, not characters.",
        ],
      },
    ],
    faqs: [
      ['How does an LLM work in simple terms?', 'It turns text into tokens, turns tokens into numbers, uses attention to understand each token in context, and predicts the next token. It repeats that prediction to write a full answer.'],
      ['Is a token the same as a word?', 'No. A token can be a whole word, part of a word, a punctuation mark or a space. Common words are often one token, and rare words are split into several.'],
      ['Do LLMs understand language?', 'They build rich internal representations that let them use language in useful ways. Whether that counts as understanding is debated. In practice, treat the output as a strong prediction and verify what matters.'],
      ['What is the difference between an LLM and a Transformer?', 'The Transformer is the architecture, the design of the network. An LLM is a large model built with that design and trained on text.'],
      ['Why do LLMs make things up?', 'They generate text that is statistically likely, and they have no built-in step that checks facts. Giving the model source documents and asking it to answer from them reduces the problem.'],
    ],
    links: [
      ['/module/transformers', 'Module 4: Transformers and How They Think'],
      ['/lesson/bpe-in-llms', 'Lesson: BPE Tokenization: How LLMs Split Text into Tokens'],
      ['/lesson/what-are-embeddings', 'Lesson: Embeddings: Encoding Meaning as Vectors'],
      ['/lesson/self-attention-in-transformers', 'Lesson: Self-Attention: How Tokens See One Another'],
      ['/lab', 'Try the free Temperature lab'],
    ],
  },
];

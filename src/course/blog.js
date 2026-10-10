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
  {
    slug: 'generative-ai-course-for-beginners',
    title: 'Generative AI Course for Beginners: What to Learn, in Order',
    description: "A generative AI course for beginners should follow a clear order. See the topics to learn, from how LLMs work to RAG, agents and evaluation, step by step.",
    date: '2026-10-10',
    minutes: 8,
    keywords: ['generative ai course', 'generative ai for beginners', 'learn generative ai', 'generative ai roadmap', 'generative ai syllabus', 'gen ai course', 'how to learn generative ai'],
    intro: [
      "A good generative AI course for beginners teaches six things in order: what generative AI is, how a large language model produces text, how to prompt it, how to give it your own data with RAG, how to let it act through agents, and how to test and run what you built. Each step makes the next one easier.",
      "This guide explains that order, says what you should be able to do after each step, and helps you tell a course for people who use AI tools from a course for people who build with them.",
    ],
    sections: [
      {
        h: 'What is generative AI, and what does a course on it teach?',
        body: [
          "Generative AI is the part of AI that creates new content: text, images, audio, video or code. A chat assistant that writes an email is generative AI. So is a tool that draws a picture from a description.",
          "Courses with this name come in two kinds. The first kind teaches you to use the tools well: how to write prompts, where the tools help at work, where they go wrong. The second kind teaches you to build products with the models. That means calling a model from code, connecting it to data, and checking the quality of its answers.",
          "Both are useful, but they are different courses. Before you start one, decide which you need. The rest of this article is about the second kind, the one for people who want to build.",
        ],
      },
      {
        h: 'What do you need before you learn generative AI?',
        body: [
          "For a building course you need basic Python: variables, functions, loops, lists, dictionaries and calling an API. You also need school-level math. You should be comfortable with a graph, an average and a simple probability.",
          "You do not need a degree in machine learning. But a short pass through the basics helps a great deal. If you know what training means, what a loss is and what overfitting looks like, the rest of the course stops feeling like magic.",
          "If you have never programmed, learn Python first. A few weeks of practice is enough to follow most lessons.",
        ],
      },
      {
        h: 'What to learn in generative AI, in order',
        body: [
          "This is the order that works for most beginners. Do not skip ahead to agents because they sound exciting. Agents are built from every step before them.",
        ],
        steps: [
          "The vocabulary. Learn what LLM, token, prompt, context window, RAG, agent and fine-tuning mean, at the level of one sentence each.",
          "Foundations. Learn how a model learns from data and what a neural network is. Keep it short and focused.",
          "How an LLM works. Tokens, embeddings, attention and the Transformer. Then how text is produced one token at a time, and what temperature does.",
          "Prompting. Clear instructions, examples, output formats, breaking a task into steps.",
          "RAG. Chunking documents, embeddings, vector search, reranking, and answering with sources.",
          "Agents. Function calling, the agent loop, memory, and standards such as MCP.",
          "Fine-tuning. What it changes, how LoRA makes it affordable, and when you do not need it.",
          "Evaluation and safety. Test sets, model-graded checks, guardrails and prompt injection.",
          "Serving. Response time, cost, caching, quantization and system design.",
        ],
      },
      {
        h: 'Do you need machine learning before generative AI?',
        body: [
          "You need a little. You can call a model through an API on your first day with no theory at all, and that is a fine way to stay motivated. The trouble comes later. When the answers are wrong, you have to work out whether the fault lies in the prompt, the retrieved text, the sampling settings or the model.",
          "That reasoning rests on a few ideas from machine learning and deep learning. Training, loss, overfitting, gradient descent and the shape of a neural network are the main ones. A beginner can cover them in a few focused weeks. After that, tokens, embeddings and attention are much easier to follow.",
          "Other kinds of generative model, such as diffusion models for images, are worth a look as well. You will mostly build with LLMs, but it helps to know that text generation is not the only method.",
        ],
      },
      {
        h: 'What should a generative AI syllabus include?',
        body: [
          "Use this table to check a syllabus. A course that stops after the third row teaches you to make a demo. The later rows are what turn a demo into a product.",
        ],
        table: {
          head: ['Topic', 'What you should be able to do afterwards'],
          rows: [
            ['How LLMs work', 'Explain tokens, embeddings, attention and next-token prediction in your own words.'],
            ['Generation settings', 'Choose temperature and sampling settings for a task and explain the effect.'],
            ['Prompting', 'Write a prompt with instructions, examples and a fixed output format, and test it.'],
            ['RAG', 'Build a question-answering tool over documents that shows its sources.'],
            ['Agents', 'Write an agent loop with a few tools, a step limit and a log.'],
            ['Fine-tuning', 'Say when fine-tuning is the right choice and describe how LoRA works.'],
            ['Evaluation', 'Build a test set and measure whether a change made answers better.'],
            ['Safety', 'Add guardrails and limit the damage of prompt injection.'],
            ['Serving', 'Reason about cost and response time, and name ways to reduce both.'],
          ],
        },
      },
      {
        h: 'What should you build while you learn?',
        body: [
          "Build one small thing after each step. Small projects that you understand fully teach more than a large one copied from a tutorial.",
        ],
        list: [
          "A script that sends a prompt to a model and prints the answer. Then change the temperature and compare the results.",
          "A summariser that always returns the same structure, such as a title, three points and one open question.",
          "A question-answering tool over a folder of your own documents, with the source shown for each answer.",
          "A list of twenty test questions for that tool, with the answers you expect. Run it after every change.",
          "An agent with two tools, for example search and a calculator, that stops after a fixed number of steps.",
        ],
      },
      {
        h: 'How long does it take to learn generative AI?',
        body: [
          "It depends on your starting point and the hours you can give. Someone who already programs and studies for an hour or two a day can cover the core ideas in a few months. Someone new to programming needs longer, because programming takes practice of its own.",
          "Treat promises of mastery in a few days with care. You can learn to call an API in an afternoon. Learning to build something reliable takes longer, and most of that time goes into testing and fixing.",
          "A better measure than hours is this: can you explain why your system gave a wrong answer, and do you know what to change?",
        ],
      },
      {
        h: 'How the AI Engineering Bootcamp teaches generative AI',
        body: [
          "The AI Engineering Bootcamp on this site has 149 video lessons in 19 modules. It follows the order above. Modules 2 and 3 cover machine learning and neural networks. Module 4 opens with a lesson on what generative AI is, then goes inside the Transformer. Later modules cover generation, prompting, RAG, agents, inference, evaluation and safety.",
          "There are three tracks. The Generative AI Engineering track covers LLMs and the systems around them. The ML and Deep Learning track covers the foundations. The Complete AI Engineer track includes both, and adds the certificate of completion.",
          "The first lesson is free with a free account. It explains six words you will meet in every later module: LLM, RAG, MCP, agent, fine-tuning and quantization.",
        ],
      },
    ],
    faqs: [
      ['Can a beginner learn generative AI?', 'Yes. With basic Python and school-level math you can start. Learn the topics in order, from how a model works to prompting, RAG and agents, and build something small at each step.'],
      ['Do I need to know coding to learn generative AI?', 'To use AI tools, no. To build products with them, yes. Python is the usual language, and functions, loops, lists and dictionaries are enough to begin.'],
      ['What is the difference between a generative AI course and a machine learning course?', 'A machine learning course teaches you to train models on data. A generative AI course teaches you to build with models that already exist, mostly LLMs. The second relies on ideas from the first.'],
      ['Should I learn RAG or agents first?', 'RAG first. Retrieval is simpler to build and to test, and most agents use retrieval as one of their tools.'],
    ],
    links: [
      ['/lesson/what-is-generative-ai', 'Lesson: Generative AI: Creating Instead of Classifying'],
      ['/lesson/six-words-of-ai-engineering', 'Free lesson: Six Concepts Every AI Engineer Must Know'],
      ['/module/transformers', 'Module 4: Transformers and How They Think'],
      ['/blog/machine-learning-vs-deep-learning-vs-generative-ai', 'Machine learning vs deep learning vs generative AI'],
      ['/pricing', 'Compare the three tracks'],
    ],
  },
  {
    slug: 'machine-learning-course-syllabus',
    title: 'Machine Learning Course for Beginners: The Syllabus to Expect',
    description: "What a machine learning course for beginners should teach: the full syllabus topic by topic, the math and Python you need, and how to judge a course.",
    date: '2026-10-08',
    minutes: 7,
    keywords: ['machine learning course', 'machine learning course for beginners', 'machine learning syllabus', 'machine learning course syllabus', 'ml course for beginners', 'machine learning topics', 'what is taught in machine learning'],
    intro: [
      "A machine learning course for beginners should cover seven areas: what machine learning is, the kinds of learning, regression and classification, loss functions and gradient descent, overfitting and regularization, evaluation metrics, and feature engineering. A good one ends with a first look at neural networks, so you know where the subject goes next.",
      "This article walks through that syllabus, says why each topic is there, and shows how to check whether a course teaches it properly.",
    ],
    sections: [
      {
        h: 'What does a machine learning course teach?',
        body: [
          "Machine learning is a way to make a computer do a task by showing it examples instead of writing rules. A course teaches you how that works and how to do it well.",
          "The centre of every beginner course is the same loop. You collect data. You choose a model. You train the model so its predictions get closer to the right answers. You measure it on data it has not seen. Then you improve it. Every topic in the syllabus is one part of this loop or a way to do one part better.",
          "If you finish a course and can run that loop alone on a new dataset, the course did its job.",
        ],
      },
      {
        h: 'Machine learning syllabus for beginners, topic by topic',
        body: [
          "The names differ from course to course, but a complete beginner syllabus has these parts.",
        ],
        table: {
          head: ['Topic', 'What it covers', 'Why it matters'],
          rows: [
            ['Introduction', 'Features, labels, models, parameters, training and prediction.', 'Gives you the words used in every later lesson.'],
            ['Types of learning', 'Supervised, unsupervised and reinforcement learning.', 'Tells you which approach fits which problem.'],
            ['Regression', 'Linear regression: predicting a number.', 'The smallest complete example of a model.'],
            ['Classification', 'Logistic regression: predicting a category.', 'Most real tasks are yes-or-no or pick-one decisions.'],
            ['Loss and training', 'Loss functions and gradient descent.', 'Explains how a model actually learns.'],
            ['Generalization', 'Train, validation and test sets, overfitting, regularization.', 'Separates a model that learned from one that memorised.'],
            ['Evaluation', 'Accuracy, precision, recall and the confusion matrix.', 'Lets you say how good a model is, honestly.'],
            ['Features', 'Feature engineering, scaling and encoding categories.', 'Better inputs often help more than a fancier model.'],
          ],
        },
      },
      {
        h: 'Supervised and unsupervised learning',
        body: [
          "Most of a beginner course is about supervised learning. Every training example comes with the right answer, called a label. The model learns to map inputs to labels. Predicting a house price and marking an email as spam are both supervised tasks.",
          "In unsupervised learning there are no labels. The model looks for structure by itself. The usual first example is clustering, which groups similar items, such as customers with similar buying habits.",
          "Many courses add a short lesson on reinforcement learning, where an agent tries actions and learns from rewards. At beginner level the aim is only to know that it exists and what kind of problem it suits.",
          "Some syllabi also list more algorithms: decision trees, random forests, nearest neighbours, support vector machines. These are worth learning. But the number of algorithms is not the measure of a course. Understanding one model deeply teaches you more than seeing ten briefly.",
        ],
      },
      {
        h: 'Loss functions, gradient descent and overfitting',
        body: [
          "These three ideas are the heart of the subject, and a course that rushes them leaves a gap you will feel later.",
          "A loss function turns the difference between a prediction and the right answer into one number. Lower is better. Different losses punish errors in different ways. L2 loss punishes large errors heavily. L1 loss treats all errors more evenly.",
          "Gradient descent is how the model lowers the loss. It looks at the slope of the loss, takes a small step downhill, and repeats.",
          "Overfitting is what happens when a model learns the training examples too closely, including their noise, and then does badly on new data. Regularization is a set of methods that hold the model back from doing this. A course should show you overfitting happening in a real example, not only define it.",
        ],
      },
      {
        h: 'How much math and Python does a beginner course need?',
        body: [
          "Less than many people fear. For Python you need variables, loops, functions, lists and dictionaries. The data libraries can be learned as you go.",
          "For math you need school level to start: straight lines, slopes, averages and simple probability. Vectors and matrices come in when a model has many features. Derivatives come in with gradient descent.",
          "A good beginner course teaches each piece of math next to the idea that uses it, with small numbers you can check by hand. Be careful with a course that demands a long math module before the first model. Many learners lose interest before they reach the part they came for.",
        ],
      },
      {
        h: 'What projects should a machine learning course include?',
        body: [
          "Practice is where the ideas settle. Look for small, complete projects more than one large showpiece.",
        ],
        list: [
          "Predict a number from a table of data, such as a price, and report the error on a test set.",
          "Classify items into two groups and report precision and recall, not only accuracy.",
          "Overfit a model on purpose, then fix it with regularization and compare the test scores.",
          "Cluster unlabeled data and describe what each group seems to mean.",
          "Improve a model by changing the features, without changing the model.",
        ],
      },
      {
        h: 'How to judge a machine learning course before you start',
        body: [
          "Open the lesson list and ask a few questions. Is every lesson listed, with what it covers? Does the course explain why each technique exists, or only how to call it? Is there a check after each lesson, such as a quiz with explanations? Can you try one lesson for free?",
          "Then look at the order. Regression should come before neural networks. Evaluation should not be left to the final week. A course that starts with deep networks on the first day is skipping the part that makes them understandable.",
          "Last, check what comes after. Machine learning is the base for deep learning and for generative AI. A course that points clearly to the next step saves you from searching for it later.",
        ],
      },
      {
        h: 'Where this fits in the AI Engineering Bootcamp',
        body: [
          "Module 2 of the AI Engineering Bootcamp, Learning from Data, is the machine learning part of the course. It has nine lessons: machine learning from first principles, supervised and unsupervised learning, linear and logistic regression, feature engineering, precision and recall, L1 and L2 loss, regularization, reinforcement learning and contrastive learning.",
          "Module 3 continues with neural networks. Both modules are in the ML and Deep Learning track and in the Complete AI Engineer track. Every lesson ends with a five-question quiz, and the practice area lets you test yourself by topic.",
        ],
      },
    ],
    faqs: [
      ['What topics are covered in a machine learning course for beginners?', 'The types of learning, linear and logistic regression, loss functions, gradient descent, overfitting and regularization, evaluation metrics such as precision and recall, and feature engineering. Many courses end with an introduction to neural networks.'],
      ['Is machine learning hard for beginners?', 'The ideas are approachable when taken one at a time and in order. It feels hard when a course skips the basics or teaches many algorithms quickly with no practice.'],
      ['How long does a beginner machine learning course take?', 'It depends on the course and your pace. The core concepts take a few weeks of steady study for someone who already programs. Being comfortable with new datasets takes longer and comes from practice.'],
      ['Do I need a machine learning course before a deep learning course?', 'Yes, at least the basics. Deep learning uses the same ideas of loss, training, overfitting and evaluation, so the foundations make it much easier.'],
    ],
    links: [
      ['/module/ml-foundations', 'Module 2: Learning from Data'],
      ['/lesson/supervised-vs-unsupervised-learning', 'Lesson: Labeled vs Unlabeled: Two Ways Machines Learn'],
      ['/lesson/l1-and-l2-loss-functions', 'Lesson: L1 vs L2 Loss: Choosing Your Error Penalty'],
      ['/blog/how-to-learn-machine-learning-from-scratch', 'How to learn machine learning from scratch'],
      ['/curriculum', 'See the full curriculum'],
    ],
  },
  {
    slug: 'deep-learning-course-syllabus',
    title: 'Deep Learning Course: What a Good Syllabus Should Cover',
    description: "What a deep learning course should cover: neural networks, backpropagation, loss, regularization, RNNs, Transformers and PyTorch, plus how to judge a syllabus.",
    date: '2026-10-07',
    minutes: 7,
    keywords: ['deep learning course', 'deep learning syllabus', 'deep learning course syllabus', 'deep learning course for beginners', 'neural networks course', 'deep learning topics', 'learn deep learning'],
    intro: [
      "A good deep learning course covers five blocks: how a neural network is built, how it learns through gradient descent and backpropagation, how to keep training stable, the main architectures from CNNs and RNNs to the Transformer, and a framework such as PyTorch to put it all into code. The best ones also show where deep learning leads next, which today means large language models.",
      "Below is what each block should contain, what you need before you start, and the signs that separate a deep syllabus from a shallow one.",
    ],
    sections: [
      {
        h: 'What is a deep learning course?',
        body: [
          "Deep learning is machine learning with neural networks that have many layers. A deep learning course teaches how those networks work, how they are trained and which designs suit which kind of data.",
          "It is a different course from machine learning, though the two are linked. A machine learning course is mostly about models for tables of data and about the general rules of training and evaluation. A deep learning course takes those rules as known and applies them to networks that learn from raw input such as images, sound and text.",
        ],
      },
      {
        h: 'What should you know before a deep learning course?',
        body: [
          "Three things make the course much smoother.",
        ],
        list: [
          "Python. You should be able to write functions and work with lists and arrays without looking everything up.",
          "Machine learning basics. Training and test data, loss, overfitting and evaluation metrics.",
          "A little math. Vectors and matrices, the idea of a slope, and basic probability. The chain rule from calculus appears in backpropagation, and a good course explains it when it is needed.",
        ],
      },
      {
        h: 'Deep learning syllabus: the core topics',
        body: [
          "Check a syllabus against this table. The first four rows are the ones you cannot do without.",
        ],
        table: {
          head: ['Block', 'Topics', 'What you can do afterwards'],
          rows: [
            ['The neuron and the network', 'Weights, bias, activation functions, layers.', 'Explain what one layer does to its input.'],
            ['Learning', 'Forward pass, loss, gradient descent, backpropagation.', 'Follow one training step by hand with small numbers.'],
            ['Loss functions', 'Cross-entropy for classification, squared error for regression.', 'Pick the loss that fits a task.'],
            ['Stable training', 'Dropout, batch normalization, layer normalization.', 'Explain why a network stopped learning and what to try.'],
            ['Architectures', 'Feed-forward networks, CNNs, RNNs, Transformers.', 'Match a design to a kind of data.'],
            ['Frameworks', 'PyTorch or TensorFlow, tensors, automatic differentiation.', 'Build and train a small network in code.'],
          ],
        },
      },
      {
        h: 'How deeply should a course teach backpropagation?',
        body: [
          "This is the best single test of a deep learning course. Backpropagation is the method a network uses to find out how much each weight contributed to the error. It is the reason training works at all.",
          "A shallow course says that the framework handles it and moves on. That is true in daily work, because you rarely write backpropagation yourself. But if you have never followed it once, later topics stay vague. You will not see why gradients can vanish in a deep network, why normalization helps, or what fine-tuning really does to a model.",
          "A good course walks through one small network with real numbers. It does the forward pass, calculates the loss, passes the error backwards with the chain rule, and updates each weight. One worked example is enough. After that you can trust the framework and know what it is doing.",
        ],
      },
      {
        h: 'CNNs, RNNs and Transformers: which architectures to expect',
        body: [
          "A syllabus should cover the main families of network and say what each one is for.",
          "Convolutional neural networks, or CNNs, were built for images. They slide small filters across a picture, so the same detector is used everywhere.",
          "Recurrent neural networks, or RNNs, were built for sequences such as text. They read one item at a time and carry a memory forward. Their weak points, slow training and fading memory over long sequences, are the reason the next design exists.",
          "The Transformer replaced step-by-step reading with attention, where every token can look at every other token directly. It is the base of modern language models and is now used for images too.",
          "How much time each gets depends on the goal of the course. A course aimed at computer vision spends longer on CNNs. A course that leads to generative AI should treat RNNs briefly and give the Transformer real depth. A syllabus that stops before the Transformer is out of date for most current work.",
        ],
      },
      {
        h: 'Should a deep learning course teach PyTorch or TensorFlow?',
        body: [
          "Either one lets you learn the subject. Both give you tensors, which are arrays of numbers that can run on a GPU, and both calculate gradients for you. PyTorch builds its graph of operations as the code runs, which many learners find easier to read and debug. TensorFlow has a long history in production systems and on mobile devices.",
          "What matters more is that the course teaches the framework after the concept, not in place of it. You should understand a training loop before a library hides it in one line. If you know what the loop does, moving between frameworks takes days, not months.",
        ],
      },
      {
        h: 'Signs of a strong deep learning course',
        body: [
          "A few checks tell you a lot before you commit your time.",
        ],
        list: [
          "It lists every lesson and what each covers.",
          "It explains why each technique exists, such as the problem dropout solves.",
          "It uses small worked examples with numbers you can verify.",
          "It makes you practise, with labs, code or quizzes after each lesson.",
          "It reaches the Transformer and connects it to language models.",
          "It makes no promise of a job or a fixed result by a fixed date.",
        ],
      },
      {
        h: 'Deep learning in the AI Engineering Bootcamp',
        body: [
          "Module 3 of the AI Engineering Bootcamp, Neural Architectures Deep Dive, has ten lessons. They cover the bias in a neuron, gradient descent, backpropagation, cross-entropy loss, dropout, batch and layer normalization, RMSNorm, recurrent neural networks, and how PyTorch and TensorFlow work.",
          "Module 4 then goes inside the Transformer in fifteen lessons, from tokenization and embeddings to attention and the feed-forward layer. Vision Transformers and image generation models appear later, in the module on multimodal AI.",
          "These modules are part of the ML and Deep Learning track and of the Complete AI Engineer track. The interactive labs let you change a value and watch the result, which helps with ideas such as attention weights that are hard to picture from text alone.",
        ],
      },
    ],
    faqs: [
      ['What is covered in a deep learning course?', 'Neural networks, gradient descent, backpropagation, loss functions, dropout and normalization, the main architectures such as CNNs, RNNs and Transformers, and a framework such as PyTorch or TensorFlow.'],
      ['Can I learn deep learning without machine learning?', 'You can start, but it is harder. Ideas such as loss, overfitting and test sets come from machine learning. A few weeks on those basics first saves time overall.'],
      ['How much math is needed for deep learning?', 'Vectors, matrices, slopes, the chain rule and basic probability. A good course teaches these alongside the topics that use them, with small worked examples.'],
      ['Is deep learning still worth learning now that LLMs exist?', 'Yes. An LLM is a deep neural network. Understanding training, attention and normalization is what lets you reason about how language models behave and how to adapt them.'],
    ],
    links: [
      ['/module/deep-learning', 'Module 3: Neural Architectures Deep Dive'],
      ['/lesson/math-behind-backpropagation', 'Lesson: Backpropagation: How Neural Networks Learn from Mistakes'],
      ['/lesson/how-does-pytorch-work', 'Lesson: PyTorch Internals: Dynamic Graphs and Autograd'],
      ['/lesson/dropout-in-neural-networks', 'Lesson: Dropout: Controlled Forgetting as Regularization'],
      ['/blog/deep-learning-explained-for-beginners', 'Deep learning explained: neural networks to Transformers'],
    ],
  },
  {
    slug: 'what-is-a-large-language-model',
    title: 'What Is a Large Language Model (LLM)? Explained Simply',
    description: "What a large language model (LLM) is, in simple words: what it does, how it is trained, what it can and cannot do, and the main types you will meet.",
    date: '2026-10-05',
    minutes: 7,
    keywords: ['what is a large language model', 'what is an llm', 'llm meaning', 'large language model explained', 'llm explained simply', 'llm vs generative ai', 'types of llm', 'what does llm stand for'],
    intro: [
      "A large language model, or LLM, is a computer program that has learned the patterns of language from a very large amount of text. You give it some text, called a prompt, and it continues with the text that is most likely to follow. Chat assistants, coding helpers and many search tools are built on LLMs.",
      "This article explains what the three words mean, what an LLM can and cannot do, how one is made, and the main types. It stays at a simple level. A separate article on this site goes step by step through the inner workings.",
    ],
    sections: [
      {
        h: 'What does LLM stand for?',
        body: [
          "LLM stands for large language model. Each word tells you something.",
          "Model means a mathematical system that has learned from examples. It is a neural network: many layers of simple units joined by adjustable numbers called parameters or weights.",
          "Language means its material is text. It learned from books, articles, websites and code, and it reads and writes text.",
          "Large refers to size in two ways. The network has a very large number of parameters, and it was trained on a very large amount of text. Size matters because a larger network trained on more text can hold more patterns.",
        ],
      },
      {
        h: 'What does a large language model actually do?',
        body: [
          "It predicts the next piece of text. That is the whole task. Given the words so far, the model works out which piece is likely to come next, adds it, and repeats.",
          "A simple comparison is the word suggestion on a phone keyboard. An LLM does the same kind of thing, but with a far larger network and far more context. It can take pages of text into account, not only the last few words.",
          "It may seem strange that prediction alone produces useful answers. The reason is that predicting text well requires a lot. To continue a sentence about history, it helps to know the history. To continue a piece of code, it helps to know how the language works. Training pushes that knowledge into the weights.",
        ],
      },
      {
        h: 'How is a large language model trained?',
        body: [
          "Training happens in stages.",
        ],
        steps: [
          "Pre-training. The model is shown huge amounts of text with the next piece hidden, and asked to predict it. Each wrong guess leads to a small correction of the weights. This stage needs a lot of computing power and is done by a small number of organisations.",
          "Instruction training. The model is trained further on examples of questions and good answers, so it learns to follow a request instead of only continuing text.",
          "Alignment. People compare answers, and the model is adjusted towards the ones they prefer, so it becomes more helpful and safer.",
          "Fine-tuning, when needed. A company can train the model a little more on its own examples for a narrow task.",
        ],
      },
      {
        h: 'What can an LLM do, and what can it not do?',
        body: [
          "An LLM is strong wherever the task can be done by reading and writing text. It is weak wherever the task needs facts it never saw, exact calculation or a guarantee of truth.",
        ],
        table: {
          head: ['Good at', 'Weak at'],
          rows: [
            ['Writing, rewriting and summarising text', 'Knowing events after its training data ends'],
            ['Answering questions on well-covered topics', 'Knowing your private documents, unless you supply them'],
            ['Explaining and writing code', 'Exact arithmetic with long numbers'],
            ['Translating between languages', 'Counting letters or characters reliably'],
            ['Pulling structured data out of messy text', 'Saying when it does not know'],
            ['Following instructions about tone and format', 'Giving the same answer every time'],
          ],
        },
      },
      {
        h: 'Why do LLMs make mistakes?',
        body: [
          "An LLM produces text that is likely, and likely is not the same as true. There is no step inside the model that checks a fact against a source. When the model lacks the information, it can still write a fluent answer that is wrong. This is called a hallucination.",
          "The model also has a knowledge cutoff. Its weights hold only what was in the training text, so newer facts are missing.",
          "Engineers work around both limits. They give the model source documents to answer from, a method called retrieval-augmented generation or RAG. They give it tools, such as a calculator or a search function. And they test its answers on a fixed set of questions before trusting it in a product.",
        ],
      },
      {
        h: 'What are the main types of LLM?',
        body: [
          "The word covers a family of models. A few distinctions come up often.",
        ],
        list: [
          "Closed and open models. Closed models are reached through an API run by the company that made them. Open models publish their weights, so you can run them on your own hardware.",
          "Large and small models. Small language models have fewer parameters. They are cheaper and faster, and can run on a laptop or a phone, at some cost in ability.",
          "Reasoning models. These spend extra steps working through a problem before they give the final answer. They help on hard tasks and cost more time.",
          "Multimodal models. These accept images or audio as well as text.",
          "Embedding models. These do not write text. They turn text into vectors that capture meaning, which search systems use.",
        ],
      },
      {
        h: 'LLM vs generative AI vs AI: how the terms relate',
        body: [
          "The three terms sit inside each other. AI is the widest. It covers any system that performs a task we link with intelligence. Generative AI is the part of AI that creates new content, such as text, images or audio. An LLM is one kind of generative AI, the kind that works with text.",
          "So every LLM is generative AI, but an image generator is generative AI without being an LLM. And a chat product is not the same thing as the model. The product is an application built around an LLM. It adds a conversation history, instructions, tools and safety checks.",
        ],
      },
      {
        h: 'How to learn more about LLMs',
        body: [
          "If you want to use LLMs well, learn three things next: what a token is, what the context window is, and what temperature does. They explain most of the behaviour you see day to day.",
          "If you want to build with them, go one layer deeper: embeddings, attention and the Transformer. In the AI Engineering Bootcamp, Module 4 covers how the model is built, Module 5 covers how it produces output, and Module 7 covers the different types of language model. The first lesson of the course is free with a free account and introduces LLMs alongside five other core terms.",
        ],
      },
    ],
    faqs: [
      ['What is an LLM in simple words?', 'It is a program trained on a very large amount of text to predict what comes next. By repeating that prediction it can write answers, summaries, translations and code.'],
      ['Is ChatGPT an LLM?', 'ChatGPT is a product built on LLMs. The model generates the text. The product around it adds the chat interface, memory of the conversation, tools and safety checks.'],
      ['What is the difference between an LLM and generative AI?', 'Generative AI is any AI that creates content, including images, audio and video. An LLM is the kind of generative AI that reads and writes text.'],
      ['Do LLMs learn from my conversations as I chat?', 'The weights of the model do not change while you chat. The model only sees the text placed in its context for that request. Whether a provider uses conversations for later training depends on its policy and your settings.'],
      ['Why is it called a large language model?', 'Because the network has a very large number of parameters and was trained on a very large amount of text. Both are far beyond earlier language models.'],
    ],
    links: [
      ['/blog/how-llms-work', 'How LLMs work: tokens, embeddings and attention'],
      ['/lesson/six-words-of-ai-engineering', 'Free lesson: Six Concepts Every AI Engineer Must Know'],
      ['/module/model-types', 'Module 7: The Language Model Zoo'],
      ['/lesson/autoregressive-models', 'Lesson: Autoregressive Models: Predicting One Token at a Time'],
      ['/glossary', 'Look up a term in the glossary'],
    ],
  },
  {
    slug: 'prompt-engineering-guide',
    title: 'Prompt Engineering Guide: Techniques That Actually Work',
    description: "A practical prompt engineering guide: how to write clear prompts, when to use few-shot examples, chain of thought and prompt chaining, and how to test them.",
    date: '2026-10-09',
    minutes: 8,
    keywords: ['prompt engineering', 'prompt engineering guide', 'prompt engineering techniques', 'how to write a good prompt', 'few-shot prompting', 'chain of thought prompting', 'prompt engineering best practices', 'zero-shot vs few-shot'],
    intro: [
      "Prompt engineering is the practice of writing the input to a language model so that it gives the output you need. The techniques that work are simple. Say exactly what you want. Give the model the context it lacks. Show examples. Fix the output format. Split hard tasks into steps. Then test the prompt on real inputs instead of trusting one good result.",
      "This guide explains each technique, when to use it, and what to do when a prompt still fails.",
    ],
    sections: [
      {
        h: 'What is prompt engineering?',
        body: [
          "A model only knows two things when it answers: what it learned in training and what is in the prompt. You cannot change the first in a normal request. Prompt engineering is the work of getting the second one right.",
          "A helpful way to think about it is that you are briefing a capable new colleague who knows nothing about your project. If you say only that you want a summary of a report, you will get a generic summary. If you say who it is for, how long it should be and what to leave out, you will get something you can use.",
          "The prompt is also a cost. Every token in it is paid for on every request, and a longer prompt takes longer to process. Good prompts are complete, not long.",
        ],
      },
      {
        h: 'The parts of a good prompt',
        body: [
          "Most strong prompts contain the same parts. Not every prompt needs all of them, but when a result disappoints, one of these is usually missing.",
        ],
        table: {
          head: ['Part', 'What it tells the model'],
          rows: [
            ['Role and goal', 'What it is helping with, and for whom.'],
            ['Context', 'The facts, documents or data it needs for this request.'],
            ['Task', 'Exactly what to do, in plain words.'],
            ['Constraints', 'Length, tone, what to include and what to leave out.'],
            ['Examples', 'One or more samples of a good answer.'],
            ['Output format', 'The structure of the reply, such as a list, a table or JSON.'],
          ],
        },
      },
      {
        h: 'Zero-shot and few-shot prompting',
        body: [
          "Zero-shot prompting means you ask for the task with no examples. It works for common tasks the model has seen many times, such as translating or summarising. Start here, because it is the cheapest option.",
          "Few-shot prompting means you add a few examples of input and output before the real input. The model picks up the pattern and follows it. This is one of the most reliable techniques there is. Use it when you need a particular style, a custom set of categories or a strict format that is hard to describe in words.",
          "Choose the examples with care. The model copies them closely. If every example is short, the answers will be short. If every example carries the same label, the model will lean towards that label. Use a small, varied set that includes a hard case.",
        ],
      },
      {
        h: 'Chain-of-thought prompting',
        body: [
          "Chain-of-thought prompting asks the model to work through a problem in steps before it gives the final answer. A model writes one token at a time, and each token is based on what came before. If it writes out the steps first, the final answer can build on them. If it must answer at once, it has nothing to build on.",
          "This helps on tasks with several steps: word problems, comparisons, decisions that depend on more than one rule. It costs extra tokens and extra time, so do not use it for simple lookups.",
          "Reasoning models do a version of this by themselves before they reply. With those models a plain instruction about the goal often works better than telling them how to think.",
        ],
      },
      {
        h: 'Prompt chaining: split a hard task into steps',
        body: [
          "One long prompt that asks for five things at once often fails at one of them. Prompt chaining breaks the job into separate calls. The output of one call becomes the input of the next.",
          "Suppose you want a reply to a customer email. The first call pulls out the question and the order number. The second drafts a reply from the right help article. The third checks the draft against your rules. Each prompt is short and has one job.",
          "The gain is control. You can test each step alone, see which one failed, and fix only that one. The price is more calls, so use chaining when a single prompt is not reliable enough.",
        ],
      },
      {
        h: 'Prompt engineering best practices',
        body: [
          "These habits improve almost any prompt.",
        ],
        list: [
          "Put long documents first and the question after them, and mark where each part begins and ends.",
          "Say what to do, not only what to avoid. A positive instruction is easier to follow.",
          "Give the reason for a rule. A model that knows why can apply the rule to cases you did not list.",
          "Ask for a format you can check by code, such as JSON with named fields.",
          "Tell the model what to do when it lacks the information. Allow it to say that it does not know.",
          "Keep the parts of the prompt that never change at the start. Many providers can cache that part, which lowers cost and delay.",
          "Change one thing at a time, so you know what caused the difference.",
        ],
      },
      {
        h: 'How do you test a prompt?',
        body: [
          "A prompt that works once has not been tested. Models give different outputs on different runs, and real inputs vary more than the one you tried.",
        ],
        steps: [
          "Collect twenty to fifty real inputs, including awkward ones.",
          "Write down what a good output looks like for each.",
          "Run the prompt on all of them and read the results.",
          "Group the failures by cause. Fix the most common cause first.",
          "Run the whole set again after each change, so a fix for one case does not break another.",
        ],
      },
      {
        h: 'When is prompt engineering not enough?',
        body: [
          "Prompting has limits, and it helps to know them early. If the model lacks facts, such as your company documents, no wording will supply them. You need to retrieve the right text and add it to the context. That is RAG. If the model must take actions or look things up, it needs tools. If you need the same behaviour across a very large number of requests and the prompt cannot hold it, fine-tuning may be the answer.",
          "This is why the wider term context engineering is now common. It covers everything the model sees: instructions, retrieved documents, tool results and conversation history. In the AI Engineering Bootcamp, Module 9, The Art of Prompting, covers chain of thought, prompt chaining, prompt caching, context engineering and context compaction.",
        ],
      },
    ],
    faqs: [
      ['What is prompt engineering in simple terms?', 'It is writing the input to an AI model clearly enough that it produces the output you need. It includes instructions, context, examples and the format of the answer.'],
      ['What is the difference between zero-shot and few-shot prompting?', 'Zero-shot gives the task with no examples. Few-shot adds a few examples of input and output first, so the model can follow the pattern.'],
      ['Is prompt engineering still worth learning?', 'Yes. Models are better at understanding loose requests than they used to be, but clear instructions, good context and testing still decide the quality of the result in a product.'],
      ['Does chain-of-thought prompting always help?', 'No. It helps on tasks with several steps. On simple tasks it adds cost and delay for little gain, and reasoning models already work through steps without being told.'],
    ],
    links: [
      ['/module/prompt-context', 'Module 9: The Art of Prompting'],
      ['/lesson/how-does-chain-of-thought-prompting-work', 'Lesson: Chain-of-Thought Prompting: Making Models Reason Step by Step'],
      ['/lesson/how-does-prompt-chaining-work', 'Lesson: Prompt Chaining: Decomposing Complex Tasks into Steps'],
      ['/lesson/how-does-prompt-caching-work', 'Lesson: Prompt Caching: Reusing Computation Across API Calls'],
      ['/blog/rag-vs-fine-tuning-vs-prompt-engineering', 'RAG vs fine-tuning vs prompt engineering'],
    ],
  },
  {
    slug: 'what-is-rag-retrieval-augmented-generation',
    title: 'What Is RAG? Retrieval-Augmented Generation and How It Works',
    description: "What RAG (retrieval-augmented generation) is and how it works: indexing, retrieval and generation step by step, why RAG fails, and how to improve it.",
    date: '2026-10-03',
    minutes: 8,
    keywords: ['what is rag', 'retrieval augmented generation', 'how does rag work', 'rag explained', 'rag in ai', 'rag pipeline', 'rag architecture', 'rag llm'],
    intro: [
      "RAG stands for retrieval-augmented generation. It is a way to make a language model answer from documents you choose, instead of only from what it learned in training. The system first searches your documents for the passages related to the question. It then places those passages in the prompt, and the model writes its answer from them.",
      "A simple picture is an open-book exam. The model does not have to remember everything. It looks up the right pages first and then answers. This article explains each stage and where it tends to go wrong.",
    ],
    sections: [
      {
        h: 'What problem does RAG solve?',
        body: [
          "A language model has three gaps. It does not know anything after its training data ends. It has never seen your private data, such as contracts, support tickets or internal manuals. And when it lacks a fact, it may still write a confident answer that is wrong.",
          "Retraining the model each time a document changes is slow and costly. RAG avoids that. The knowledge stays outside the model, in a store you control. To update what the system knows, you update the documents.",
          "RAG also lets the system show its sources. A user can open the passage an answer came from and check it. For many business uses that matters as much as the answer.",
        ],
      },
      {
        h: 'How does RAG work, step by step?',
        body: [
          "A RAG system has two phases. Indexing happens ahead of time. Retrieval and generation happen each time a question arrives.",
        ],
        steps: [
          "Load the documents and turn them into plain text.",
          "Split the text into chunks, pieces small enough to search and to fit in a prompt.",
          "Turn each chunk into an embedding, a vector that captures its meaning, and store it in a vector database.",
          "When a question arrives, turn the question into an embedding with the same model.",
          "Find the chunks whose vectors are closest to the question vector.",
          "Optionally rerank those chunks, so the most relevant ones come first.",
          "Build a prompt that holds the instructions, the chosen chunks and the question.",
          "The model writes an answer from that text, with references to the chunks it used.",
        ],
      },
      {
        h: 'The parts of a RAG pipeline',
        body: [
          "Each part has one job, and each can be improved separately.",
        ],
        table: {
          head: ['Part', 'What it does'],
          rows: [
            ['Chunker', 'Splits documents into pieces that keep their meaning.'],
            ['Embedding model', 'Turns text into vectors, so similar meanings sit close together.'],
            ['Vector database', 'Stores the vectors and finds the nearest ones quickly.'],
            ['Retriever', 'Runs the search. It may combine vector search with keyword search.'],
            ['Reranker', 'Scores the retrieved chunks again and puts the best first.'],
            ['Prompt builder', 'Places instructions, chunks and the question into one prompt.'],
            ['Generator', 'The language model that writes the answer.'],
          ],
        },
      },
      {
        h: 'Why does chunking matter so much?',
        body: [
          "Chunking decides what the search can find. If a chunk is too large, it mixes several topics, its embedding becomes vague, and it wastes space in the prompt. If a chunk is too small, it loses the context that gives it meaning. A sentence that says the limit is thirty days is useless without knowing which limit.",
          "Simple chunking cuts every fixed number of characters, with a small overlap between neighbours. Better chunking follows the structure of the document: headings, paragraphs, list items. Tables and code need special care, because a table cut in half means nothing.",
          "There is no single correct chunk size. It depends on the documents and the questions. The honest way to choose is to try a few settings and measure which one retrieves the right passages most often.",
        ],
      },
      {
        h: 'Semantic search, keyword search and hybrid search',
        body: [
          "Vector search is also called semantic search. It finds text with a similar meaning even when the words differ. A question about refunds can match a passage about getting money back.",
          "It has a weakness. Exact terms such as product codes, error numbers and names may not be matched well, because the embedding blurs them. Keyword search is strong exactly there.",
          "Hybrid search runs both and merges the results. Many production systems use it for that reason. A reranker is often added afterwards. It reads the question together with each candidate chunk and gives a more careful relevance score than the first, fast search can.",
        ],
      },
      {
        h: 'Why do RAG systems fail?',
        body: [
          "When a RAG answer is wrong, find out which stage failed before you change anything.",
        ],
        list: [
          "The answer is not in the documents. No search can find what is not there.",
          "The right chunk exists but was not retrieved. Look at chunking, the embedding model and the search method.",
          "The right chunk was retrieved but ranked too low to be included. A reranker helps.",
          "Too many chunks were included. The useful one is buried, and models can miss details in the middle of a long context.",
          "The model had the right text and ignored it or misread it. Tighten the instructions and ask it to answer only from the sources.",
          "The question was vague. Rewriting the question before searching can help.",
        ],
      },
      {
        h: 'Beyond basic RAG',
        body: [
          "Once the basic pipeline works, several extensions deal with harder questions.",
          "HyDE asks the model to write a made-up answer first and then searches with that text, because an answer often looks more like the target passage than the question does. Agentic RAG lets the model decide when to search, what to search for and whether to search again. GraphRAG builds a graph of the people, things and relations in the documents, which helps with questions that span many of them. Vectorless RAG retrieves without embeddings at all, for example by letting the model walk through the outline of a document.",
          "Add these only when your tests show a need. Each one brings extra cost and extra parts that can break.",
        ],
      },
      {
        h: 'How to learn RAG properly',
        body: [
          "Build a small system on documents you know well, so you can tell when an answer is wrong. Print the retrieved chunks for every question and read them. Most of what you learn about RAG comes from that habit.",
          "Module 10 of the AI Engineering Bootcamp, Building RAG Systems, has thirteen lessons. They cover vector databases, approximate nearest neighbour search, semantic and hybrid search, rerankers, chunking, HyDE, caching, agentic RAG, GraphRAG and vectorless RAG.",
        ],
      },
    ],
    faqs: [
      ['What does RAG stand for?', 'Retrieval-augmented generation. The system retrieves relevant text, adds it to the prompt, and the model generates an answer from it.'],
      ['Does RAG train the model on my data?', 'No. The weights of the model do not change. Your documents are searched at question time, and the relevant passages are placed in the prompt.'],
      ['Does RAG remove hallucinations?', 'It reduces them when the right passages are retrieved, because the model answers from text in front of it. It does not remove them. Poor retrieval or unclear sources still lead to wrong answers.'],
      ['What is the difference between RAG and fine-tuning?', 'RAG adds knowledge at question time by changing the prompt. Fine-tuning changes the behaviour of the model by training its weights. RAG suits facts that change. Fine-tuning suits style and format.'],
      ['Is RAG still needed with large context windows?', 'Often, yes. Putting every document into every prompt costs more, takes longer and can hide the important passage. Retrieval keeps the context short and relevant.'],
    ],
    links: [
      ['/module/rag', 'Module 10: Building RAG Systems'],
      ['/lesson/chunking-strategies-for-rag', 'Lesson: Document Chunking Strategies for RAG'],
      ['/lesson/how-does-hybrid-search-work', 'Lesson: Hybrid Search: Combining Sparse and Dense Retrieval'],
      ['/lesson/how-does-a-reranker-work', 'Lesson: Rerankers: Re-Scoring Retrieved Results by Relevance'],
      ['/blog/vector-databases-and-embeddings-explained', 'Vector databases and embeddings explained'],
    ],
  },
  {
    slug: 'vector-databases-and-embeddings-explained',
    title: 'Vector Databases and Embeddings Explained for Beginners',
    description: "Vector databases and embeddings explained simply: what an embedding is, how similarity search works, what HNSW and ANN mean, and when you need a vector store.",
    date: '2026-10-01',
    minutes: 7,
    keywords: ['vector database', 'what is a vector database', 'embeddings explained', 'what are embeddings', 'vector search', 'similarity search', 'cosine similarity', 'vector database vs traditional database'],
    intro: [
      "An embedding is a list of numbers that represents the meaning of a piece of text, an image or another item. A vector database stores many embeddings and can quickly find the ones closest to a given embedding. Together they let software search by meaning instead of by exact words.",
      "This is the technology under semantic search, recommendations and RAG. The article explains both halves and how they connect, with no heavy math.",
    ],
    sections: [
      {
        h: 'What is an embedding?',
        body: [
          "Computers compare numbers easily and meanings poorly. An embedding closes that gap. An embedding model reads a piece of text and returns a vector, a long list of numbers, often hundreds or thousands of them.",
          "The numbers are not readable one by one. What matters is position. You can think of each vector as a point in a space with many dimensions. The model was trained so that texts with similar meaning land near each other. A sentence about a cat sleeping on a sofa lands close to a sentence about a kitten resting on a couch, though they share almost no words.",
          "The same idea works for images, audio and products. Anything a model can turn into a vector can be compared this way.",
        ],
      },
      {
        h: 'How do you measure similarity between vectors?',
        body: [
          "Once items are points in space, similar means close. There are three common ways to measure closeness.",
        ],
        table: {
          head: ['Measure', 'What it compares', 'Typical use'],
          rows: [
            ['Cosine similarity', 'The angle between two vectors, ignoring their length.', 'Text embeddings. The usual default.'],
            ['Dot product', 'Angle and length together.', 'Models trained with it. Equal to cosine when vectors have length one.'],
            ['Euclidean distance', 'The straight-line distance between two points.', 'Cases where the size of the values carries meaning.'],
          ],
        },
      },
      {
        h: 'What is a vector database?',
        body: [
          "A vector database is a store built for one main question: which stored vectors are closest to this one? You give it a query vector and a number, say five, and it returns the five nearest items.",
          "Each record usually holds three things: the vector, the original text or a pointer to it, and metadata such as the source, the date or the author. Metadata lets you filter. You can ask for the nearest chunks that also come from one product manual or from the current year.",
          "Some vector databases are separate products. Others are an extension to a database you may already use. For a small project, a library that keeps vectors in memory is enough. The idea is the same in each case.",
        ],
      },
      {
        h: 'How does vector search work at scale?',
        body: [
          "The simplest search compares the query with every stored vector and keeps the best. This is exact, and it is fine for a small collection. With millions of vectors it becomes too slow for a live product.",
          "Large systems use approximate nearest neighbour search, or ANN. It gives up a little accuracy to gain a great deal of speed. Instead of checking everything, it uses an index, a structure built ahead of time that leads the search towards the right region.",
          "A widely used index is HNSW. It links each vector to some of its neighbours, forming a graph with several layers. The top layer has few points and long links, for big jumps. Lower layers have more points and shorter links, for fine steps. A search starts at the top and moves closer at every layer. Another approach groups vectors into clusters and searches only the nearest clusters.",
          "Every index has settings that trade speed and memory against recall, which is the share of the true nearest items that the search finds.",
        ],
      },
      {
        h: 'Vector database vs traditional database',
        body: [
          "The two answer different kinds of question, and most products need both.",
        ],
        table: {
          head: ['', 'Traditional database', 'Vector database'],
          rows: [
            ['Typical question', 'Which rows match this exact value?', 'Which items are most similar to this one?'],
            ['Data', 'Tables of numbers, text and dates', 'Vectors with attached metadata'],
            ['Match type', 'Exact', 'Nearest, ranked by similarity'],
            ['Index', 'Sorted trees and hash tables', 'Graph or cluster indexes for ANN'],
            ['Result', 'All rows that match', 'The top few closest items'],
          ],
        },
      },
      {
        h: 'How do embeddings and vector databases power RAG?',
        body: [
          "RAG is the most common reason people meet this topic. The flow is short.",
        ],
        steps: [
          "Split your documents into chunks.",
          "Send each chunk through an embedding model and store the vector with the text.",
          "When a user asks a question, embed the question with the same model.",
          "Ask the vector database for the nearest chunks.",
          "Put those chunks into the prompt, so the language model can answer from them.",
        ],
      },
      {
        h: 'Common mistakes with embeddings and vector search',
        body: [
          "These problems account for many poor search results.",
        ],
        list: [
          "Using one embedding model for the documents and a different one for the questions. Vectors from different models cannot be compared.",
          "Changing the embedding model without embedding every document again.",
          "Embedding chunks that are too large, so each vector is a blur of several topics.",
          "Relying on vector search alone for exact terms such as codes and names. Add keyword search.",
          "Embedding the same text again and again. A cache of embeddings saves time and money.",
          "Tuning the index for speed without checking how much recall was lost.",
          "Assuming that near in vector space means correct. Similar text can still be the wrong answer.",
        ],
      },
      {
        h: 'Do you always need a vector database?',
        body: [
          "No. If you have a few hundred or a few thousand chunks, you can keep the vectors in memory and compare the query with all of them. That is exact and fast enough. A dedicated vector database earns its place when the collection is large, when many users search at once, or when you need filtering, updates and backups handled for you.",
          "It is also worth asking whether vectors are the right tool. Keyword search is hard to beat for exact terms, and some retrieval methods use no embeddings at all.",
          "In the AI Engineering Bootcamp, the lesson on embeddings sits in Module 4, and Module 10 covers vector databases, ANN search, semantic search, hybrid search and embedding caches. A later lesson shows how images become embeddings too.",
        ],
      },
    ],
    faqs: [
      ['What is a vector database in simple terms?', 'It is a database that stores lists of numbers called vectors and finds the ones closest to a query vector. Because close vectors mean similar content, it lets you search by meaning.'],
      ['What is the difference between an embedding and a vector?', 'A vector is any list of numbers. An embedding is a vector produced by a model so that its position reflects the meaning of the item it represents.'],
      ['Is a vector database required for RAG?', 'No. Small collections can be searched in memory, and some RAG systems use keyword search or other methods. A vector database helps when the collection or the traffic is large.'],
      ['What is cosine similarity?', 'It is a measure of how closely two vectors point in the same direction. A higher value means the two items are more alike in meaning.'],
      ['What does HNSW mean?', 'Hierarchical Navigable Small World. It is a graph index that lets a search jump quickly towards the nearest vectors without checking every one.'],
    ],
    links: [
      ['/lesson/what-are-embeddings', 'Lesson: Embeddings: Encoding Meaning as Vectors'],
      ['/lesson/how-does-a-vector-database-work', 'Lesson: Vector Databases: Storing and Searching Embeddings at Scale'],
      ['/lesson/how-does-approximate-nearest-neighbor-ann-search-work', 'Lesson: ANN Search: Finding Similar Vectors Without Brute Force'],
      ['/lesson/how-does-semantic-search-work', 'Lesson: Semantic Search: Finding Meaning, Not Just Keywords'],
      ['/blog/what-is-rag-retrieval-augmented-generation', 'What is RAG and how does it work?'],
    ],
  },
  {
    slug: 'fine-tuning-an-llm',
    title: 'Fine-Tuning an LLM: When to Do It and How It Works (LoRA)',
    description: "Fine-tuning an LLM explained: what it changes, when it is worth doing, the steps from data to evaluation, and how LoRA and QLoRA make it affordable.",
    date: '2026-10-06',
    minutes: 8,
    keywords: ['fine-tuning an llm', 'how to fine-tune an llm', 'llm fine-tuning', 'what is fine-tuning', 'lora fine-tuning', 'what is lora', 'qlora', 'when to fine-tune a model'],
    intro: [
      "Fine-tuning an LLM means taking a model that is already trained and training it a little more on your own examples, so that it behaves the way you need without long instructions. It is worth doing when you need a consistent style, format or narrow skill that prompting cannot hold. It is the wrong tool for adding facts.",
      "Today most fine-tuning uses LoRA, a method that trains a small set of extra weights and leaves the original model untouched. This article explains when to fine-tune, how the process runs and how LoRA works.",
    ],
    sections: [
      {
        h: 'What is fine-tuning?',
        body: [
          "A pre-trained model has general abilities. It can write, summarise and follow instructions. Fine-tuning continues its training on a smaller set of examples that show one specific behaviour. Each example is a pair: an input and the output you want for it.",
          "The mechanism is the same as in any training. The model produces an output. A loss function measures how far it is from the target. Backpropagation works out how each weight should change, and the weights move a little. After enough examples the new behaviour is built into the model.",
          "The key point is that fine-tuning changes the weights. Prompting and RAG change only the input.",
        ],
      },
      {
        h: 'When should you fine-tune an LLM?',
        body: [
          "Try a good prompt first, then retrieval if the model lacks knowledge. Fine-tune when those are not enough and you can name the failure. The table shows the usual cases.",
        ],
        table: {
          head: ['Situation', 'Fine-tune?', 'Reason'],
          rows: [
            ['You need a fixed tone or house style', 'Often yes', 'Style is a behaviour, and examples teach it well.'],
            ['You need a strict output format every time', 'Often yes', 'Training makes the format the default.'],
            ['You want a small model to do one job well', 'Yes', 'A tuned small model can replace a costly large one for that job.'],
            ['Your prompt is very long and sent on every request', 'Maybe', 'Tuning can move instructions and examples into the weights.'],
            ['The model lacks your company facts', 'No', 'Use RAG. Facts in weights are hard to update and to trace.'],
            ['The facts change every week', 'No', 'You would have to train again each time.'],
            ['You have only a handful of examples', 'No', 'Put them in the prompt as few-shot examples.'],
          ],
        },
      },
      {
        h: 'How does fine-tuning an LLM work, step by step?',
        body: [
          "The steps are the same whichever tool you use.",
        ],
        steps: [
          "Define the task and write down how you will judge success.",
          "Build an evaluation set and measure the base model with your best prompt. This is the baseline you must beat.",
          "Collect training examples as pairs of input and ideal output. Quality matters more than quantity.",
          "Hold some examples back. Never test on data the model trained on.",
          "Choose a base model and a method, usually LoRA.",
          "Train, and watch the loss on the held-back examples to spot overfitting.",
          "Compare the tuned model with the baseline on the evaluation set.",
          "Read real outputs, not only scores. Then deploy and keep monitoring.",
        ],
      },
      {
        h: 'What is LoRA and why is it used?',
        body: [
          "Full fine-tuning updates every weight in the model. For a large model that needs a lot of GPU memory, and the result is a complete new copy of the model for each task.",
          "LoRA stands for low-rank adaptation. It freezes the original weights and adds two small matrices next to each of the large weight matrices you choose to adapt. Only the small matrices are trained. Multiplied together, they form an update of the same shape as the large matrix, and that update is added to it.",
          "The idea behind it is that the change a task requires is simple compared with the full model, so it can be captured with far fewer numbers. A setting called the rank controls how many. A higher rank gives the update more capacity and costs more memory.",
          "The benefits are practical. Training needs much less memory. The result, called an adapter, is a small file. You can keep one base model and swap adapters for different tasks, or merge an adapter into the base weights so it adds no delay at run time.",
        ],
      },
      {
        h: 'What is QLoRA?',
        body: [
          "LoRA cuts the number of weights you train, but the frozen base model still has to sit in memory. QLoRA goes one step further. It loads the base model in a quantized form, which stores each weight with fewer bits, and trains LoRA adapters on top.",
          "This lowers memory use enough that a model of moderate size can be tuned on a single GPU. The trade is that quantization loses a little precision and training can be slower. If you have the hardware, compare a QLoRA run with a plain LoRA run on your evaluation set.",
        ],
      },
      {
        h: 'Other ways to adapt a model',
        body: [
          "LoRA is the common choice, but it is not the only one.",
        ],
        list: [
          "Prefix tuning trains a short sequence of vectors that is placed before the input, and leaves the model frozen.",
          "Knowledge distillation trains a small model to copy the outputs of a large one, so the small model can do the task at lower cost.",
          "Preference tuning trains on pairs of better and worse answers, to move the model towards what people prefer.",
          "Hosted fine-tuning, where a provider trains a private version of its model on the examples you upload.",
        ],
      },
      {
        h: 'Common fine-tuning mistakes',
        body: [
          "Most failed fine-tuning projects fail for ordinary reasons.",
        ],
        list: [
          "No baseline. Without one you cannot tell whether tuning helped.",
          "Poor data. The model learns every flaw in the examples, including inconsistent formats.",
          "Fine-tuning to teach facts. The model may still state them wrongly, and updating them means training again.",
          "Overfitting. With too many passes over a small dataset, the model repeats the training examples and handles new inputs badly.",
          "Forgetting. Heavy tuning on a narrow task can weaken general abilities the model had before.",
          "Mismatched format. The prompt format used in training must match the one used in production.",
        ],
      },
      {
        h: 'How to learn fine-tuning',
        body: [
          "Fine-tuning rests on ideas from deep learning: loss, gradient descent, backpropagation and overfitting. If those are clear, LoRA is a short step. If they are not, start there.",
          "Module 8 of the AI Engineering Bootcamp, Teaching and Shaping Models, has eleven lessons. They cover fine-tuning, LoRA, prefix tuning, knowledge distillation, continual learning, and the methods used to align models with human preferences, such as RLHF and DPO. Quantization, which QLoRA depends on, has a lesson in the module on serving models.",
        ],
      },
    ],
    faqs: [
      ['What is fine-tuning in simple terms?', 'It is extra training of an existing model on your own examples, so that it learns a specific behaviour. The weights of the model change as a result.'],
      ['How much data do I need to fine-tune an LLM?', 'It depends on the task and the model. A narrow format task needs far fewer examples than a broad skill. Start small with clean examples, measure, and add more only if the results call for it.'],
      ['Is LoRA as good as full fine-tuning?', 'For many tasks it comes close at a fraction of the cost. Full fine-tuning can do better when the task differs a lot from what the model already knows.'],
      ['Should I fine-tune or use RAG?', 'Use RAG when the model lacks knowledge. Fine-tune when it lacks a behaviour, such as a style or format. Many products use both.'],
      ['Can I fine-tune a model on my own computer?', 'Small models can be tuned with LoRA or QLoRA on a single GPU with enough memory. Larger models need rented hardware or a hosted fine-tuning service.'],
    ],
    links: [
      ['/lesson/how-does-fine-tuning-work', 'Lesson: Fine-Tuning: Adapting a Pre-Trained Model to Your Task'],
      ['/lesson/lora-low-rank-adaptation-of-llms', 'Lesson: LoRA: Parameter-Efficient Fine-Tuning via Low-Rank Matrices'],
      ['/lesson/how-does-model-quantization-work', 'Lesson: Model Quantization: Shrinking Weights Without Breaking Outputs'],
      ['/module/training-alignment', 'Module 8: Teaching and Shaping Models'],
      ['/blog/rag-vs-fine-tuning-vs-prompt-engineering', 'RAG vs fine-tuning vs prompt engineering'],
    ],
  },
  {
    slug: 'transformer-architecture-explained',
    title: 'Transformer Architecture Explained Step by Step',
    description: "Transformer architecture explained step by step: tokens, embeddings, positions, self-attention, feed-forward layers, and encoder vs decoder models.",
    date: '2026-10-04',
    minutes: 8,
    keywords: ['transformer architecture', 'transformer architecture explained', 'how do transformers work', 'transformer model explained', 'encoder vs decoder', 'self-attention explained', 'attention is all you need explained', 'transformer neural network'],
    intro: [
      "The Transformer is the neural network design behind modern language models. It takes a sequence of tokens, turns each one into a vector, and passes the vectors through a stack of identical blocks. In each block, every token first gathers information from the other tokens through attention, and then a small network processes each token separately. At the top, the model predicts the next token.",
      "This article follows one piece of text through the whole structure, one stage at a time. You need to know what a vector is. Nothing more.",
    ],
    sections: [
      {
        h: 'What is a Transformer?',
        body: [
          "A Transformer is an architecture, a plan for how the parts of a network are arranged. Research on machine translation introduced it. Earlier models for text, called recurrent neural networks, read one token after another and carried a memory along. That was slow, and information from far back faded.",
          "The Transformer dropped the step-by-step reading. It looks at all tokens at once and lets each one connect directly to any other. This solved the fading problem and allowed training to run in parallel on GPUs, which made much larger models practical.",
        ],
      },
      {
        h: 'The Transformer step by step',
        body: [
          "Here is the full path, from text in to prediction out, for a model that generates text.",
        ],
        steps: [
          "Tokenization. The text is cut into tokens, and each token is replaced by an ID number.",
          "Embedding. Each ID is looked up in a table and replaced by a vector.",
          "Position. Information about the order of the tokens is added, because attention alone has no sense of order.",
          "Self-attention. Each token looks at the other tokens and pulls in information from the relevant ones.",
          "Feed-forward network. Each token vector is processed separately by a small two-layer network.",
          "Residual connections and normalization. Around both sublayers, the input is added back to the output and the values are kept in a steady range.",
          "Repeat. Steps four to six form one block. The model stacks many blocks.",
          "Output. The final vector at the last position is turned into a score for every token in the vocabulary, and the scores become probabilities.",
        ],
      },
      {
        h: 'How does self-attention work?',
        body: [
          "Attention is the part that makes a Transformer a Transformer. Each token produces three vectors from its own vector: a query, a key and a value.",
          "The query says what this token is looking for. The key says what this token offers. The value is the information it will pass on if chosen.",
          "To update one token, the model compares its query with the key of every token. Each comparison gives a score. A function called softmax turns the scores into weights that add up to one. The token then takes a weighted mix of all the values. Tokens with high weights contribute a lot. Tokens with low weights contribute almost nothing.",
          "Take the sentence: the animal did not cross the road because it was tired. When the model updates the token it, the query for it matches the key for animal strongly. So the vector for it absorbs information about the animal. The model has worked out what the pronoun refers to.",
          "Before the softmax, the scores are divided by a fixed number tied to the vector size. This keeps them from growing too large, which would make training unstable. The whole operation is called scaled dot-product attention.",
        ],
      },
      {
        h: 'Why multi-head attention?',
        body: [
          "One round of attention can track one kind of relationship. Language has many at once: which noun a pronoun refers to, which verb belongs to which subject, which adjective describes which thing.",
          "Multi-head attention runs several attention operations side by side. Each head has its own way of making queries, keys and values, so each can learn to look for something different. Their results are joined and mixed back into one vector per token.",
        ],
      },
      {
        h: 'What do the feed-forward layer, residuals and normalization do?',
        body: [
          "Attention moves information between tokens. The feed-forward network then works on each token alone. It widens the vector, applies an activation function and narrows it again. Much of what the model knows is thought to be stored in these layers.",
          "A residual connection adds the input of a sublayer to its output. This gives the signal a direct path through a very deep stack, so the gradients used in training can reach the early layers.",
          "Normalization keeps the numbers in a steady range from layer to layer. The original design used layer normalization. Many newer models use a lighter version called RMSNorm.",
        ],
      },
      {
        h: 'Encoder vs decoder: what is the difference?',
        body: [
          "The original Transformer had two halves. The encoder reads the whole input and builds a rich representation of it. The decoder writes the output one token at a time. In the decoder, a rule called causal masking stops each token from looking at tokens that come after it. A third kind of attention, cross-attention, lets the decoder look at the output of the encoder.",
          "Later models often keep only one half.",
        ],
        table: {
          head: ['Type', 'How it reads', 'Typical use'],
          rows: [
            ['Encoder-only', 'Every token sees the whole input, in both directions.', 'Classification, search, embeddings.'],
            ['Decoder-only', 'Each token sees only the tokens before it.', 'Text generation. Most chat models are this type.'],
            ['Encoder-decoder', 'The encoder reads the input, and the decoder writes with cross-attention to it.', 'Translation and other input-to-output tasks.'],
          ],
        },
      },
      {
        h: 'How do Transformers know word order?',
        body: [
          "Attention treats its input as a set. Without extra information, the dog bit the man and the man bit the dog would look alike. So position has to be supplied.",
          "The original design added a fixed pattern of numbers to each embedding, different for each position. Many current models use rotary position embedding, or RoPE. It rotates the query and key vectors by an angle that depends on position, so the attention score between two tokens reflects how far apart they are.",
        ],
      },
      {
        h: 'How to study the Transformer',
        body: [
          "Learn it in the order the data flows: tokens, embeddings, positions, attention, feed-forward, output. Work through one small attention example by hand, with vectors of two or three numbers. It takes an hour and removes most of the mystery.",
          "Module 4 of the AI Engineering Bootcamp, Transformers and How They Think, has fifteen lessons that follow this path. They include separate lessons on the math of queries, keys and values, scaled dot-product attention, causal masking, multi-head attention, cross-attention and RoPE. The labs let you inspect attention weights yourself.",
        ],
      },
    ],
    faqs: [
      ['What is a Transformer in AI?', 'It is a neural network design that processes all tokens of a sequence together and uses attention to let each token draw on the others. It is the base of modern language models.'],
      ['What does the phrase attention is all you need mean?', 'It is the title of the research paper that introduced the Transformer. The point was that a model built on attention, with no recurrent layers, was enough for strong results on sequence tasks.'],
      ['What is the difference between an encoder and a decoder?', 'An encoder reads the full input in both directions and builds a representation of it. A decoder generates output one token at a time and can only look at earlier tokens.'],
      ['Are GPT models Transformers?', 'Yes. They are decoder-only Transformers. They use causal masking and are trained to predict the next token.'],
      ['Why did Transformers replace RNNs?', 'They process tokens in parallel, so they train faster on large data, and attention links distant tokens directly, so long-range information does not fade.'],
    ],
    links: [
      ['/lesson/decoding-transformer-architecture', 'Lesson: The Transformer Architecture: Built on Attention'],
      ['/lesson/math-behind-attention-qkv', 'Lesson: Attention Math: Queries, Keys, and Values Unpacked'],
      ['/lesson/encoder-vs-decoder-in-transformers', 'Lesson: Encoder vs Decoder: Two Sides of the Transformer'],
      ['/module/transformers', 'Module 4: Transformers and How They Think'],
      ['/blog/how-llms-work', 'How LLMs work: tokens, embeddings and attention'],
    ],
  },
  {
    slug: 'ai-engineer-projects-for-portfolio',
    title: 'AI Engineer Projects for Your Portfolio: Ideas by Level',
    description: "AI engineer project ideas for your portfolio, grouped by level: beginner, intermediate and advanced, with what each one teaches and how to present it.",
    date: '2026-10-02',
    minutes: 8,
    keywords: ['ai engineer projects', 'ai projects for portfolio', 'ai engineer portfolio', 'generative ai project ideas', 'llm projects', 'rag project ideas', 'ai agent project ideas', 'ai projects for beginners'],
    intro: [
      "A good AI engineering portfolio has a few projects that show the whole job: a model call that returns structured output, a retrieval system over real documents, an agent that uses tools, and an evaluation that proves the thing works. Three or four finished projects you can explain in depth are worth more than a long list of copied tutorials.",
      "This article gives project ideas at three levels, says what each one teaches, and explains how to present the work so a reader can judge it quickly.",
    ],
    sections: [
      {
        h: 'What makes a good AI engineer portfolio project?',
        body: [
          "A reader of your portfolio wants to know one thing: can this person build an AI feature that works and explain why it works? A project answers that when it has four qualities.",
        ],
        list: [
          "It solves a real, narrow problem. A tool that answers questions about one set of documents beats a general assistant that does everything badly.",
          "It is measured. There is a test set and a number, before and after your changes.",
          "It is honest about limits. You say where it fails and what you would do next.",
          "It can be run. Clear setup steps, or a short recording of it working.",
        ],
      },
      {
        h: 'Beginner AI projects',
        body: [
          "These need basic Python and access to a model through an API. Each one teaches a single idea.",
        ],
        list: [
          "A structured summariser. Take an article and return a title, key points and open questions as JSON. Teaches prompting and output formats.",
          "A support ticket classifier. Sort messages into your own categories using a few examples in the prompt. Report precision and recall for each category.",
          "A sampling explorer. Send the same prompt at several temperature settings and compare the outputs side by side. Teaches how generation works.",
          "A data extractor. Pull names, dates and amounts out of messy text such as receipts or emails, and check the result with code.",
          "A semantic search tool over your own notes. Embed each note, embed the query, and return the closest matches. Teaches embeddings and similarity.",
        ],
      },
      {
        h: 'Intermediate AI projects',
        body: [
          "These join several parts together, and they are where a portfolio starts to look like real work.",
        ],
        list: [
          "A document question-answering system with sources. Build the full RAG pipeline: chunking, embeddings, vector search and an answer that points to the passages it used.",
          "Hybrid search with a reranker. Add keyword search and reranking to that system and measure how retrieval changes.",
          "An evaluation harness. Write a fixed set of questions with expected answers, score each run, and show the results as a table over time.",
          "A tool-using agent. Give a model three or four tools, write the loop yourself, add a step limit and log every step.",
          "A natural language to SQL assistant. Turn a question into a query, validate the query before it runs, and allow read-only access.",
          "A chat interface that streams tokens as they arrive, with a cache for repeated questions.",
        ],
      },
      {
        h: 'Advanced AI projects',
        body: [
          "These show judgment about quality, cost and safety. One of them, done well, is enough.",
        ],
        list: [
          "A fine-tuned small model. Tune a small open model with LoRA for one narrow task and compare it with a large model on quality, speed and cost.",
          "A local model. Run a quantized model on your own machine and measure the trade between size, speed and answer quality.",
          "A research agent. Let an agent plan, search, read and write a report with sources, and evaluate it across many steps.",
          "A model router. Send easy requests to a small model and hard ones to a large one, and report the saving and the quality.",
          "A guarded assistant. Add input and output checks, test it against prompt injection attempts, and document what got through.",
          "A voice assistant that listens, thinks and speaks with a short delay. Teaches streaming and system design.",
        ],
      },
      {
        h: 'Which project teaches which skill?',
        body: [
          "Pick projects so that together they cover the main skills. This table helps you check for gaps.",
        ],
        table: {
          head: ['Project', 'Main skill it shows', 'Level'],
          rows: [
            ['Structured summariser', 'Prompting and output formats', 'Beginner'],
            ['Semantic search over notes', 'Embeddings and similarity', 'Beginner'],
            ['Document question answering', 'RAG from end to end', 'Intermediate'],
            ['Evaluation harness', 'Measuring quality', 'Intermediate'],
            ['Tool-using agent', 'Function calling and the agent loop', 'Intermediate'],
            ['Fine-tuned small model', 'Adapting models and comparing costs', 'Advanced'],
            ['Guarded assistant', 'Safety and prompt injection', 'Advanced'],
            ['Model router', 'Cost, speed and system design', 'Advanced'],
          ],
        },
      },
      {
        h: 'How to present an AI project',
        body: [
          "The write-up matters as much as the code. Many readers will see only the first page. Put these items there, in this order.",
        ],
        steps: [
          "One sentence on the problem and who has it.",
          "A simple diagram of the parts and how data moves between them.",
          "The choices you made and one alternative you rejected, with the reason.",
          "How you evaluated it: the test set, the metric and the results before and after key changes.",
          "Where it fails. Give two or three real examples.",
          "The cost and response time of a typical request.",
          "How to run it, and what you would build next.",
        ],
      },
      {
        h: 'Mistakes to avoid in AI portfolio projects',
        body: [
          "A few habits weaken an otherwise good portfolio.",
        ],
        list: [
          "Copying a tutorial without changing it. Readers have seen the same project many times.",
          "No evaluation. A demo that worked once proves little.",
          "Hiding the framework. If a library wrote the agent loop for you, be ready to explain what it does.",
          "Too many projects, none finished. Depth beats count.",
          "Committing API keys or private data to a public repository.",
          "Claiming more than you measured. State what you tested and nothing beyond it.",
        ],
      },
      {
        h: 'How to choose your next project',
        body: [
          "Choose data you know well, so that you can tell when an answer is wrong. Choose a problem small enough to finish in a couple of weeks. Then go one level deeper than a tutorial would. Add the evaluation, or the reranker, or the injection tests.",
          "A project helps you learn and gives you something concrete to discuss. It does not guarantee an interview or an offer. Those depend on the role and the employer.",
          "The AI Engineering Bootcamp covers the ideas behind every project in this article, and its 42 interactive labs let you try parts such as temperature, attention and retrieval before you build them. The practice area is a good place to check your understanding first.",
        ],
      },
    ],
    faqs: [
      ['What projects should an AI engineer have in a portfolio?', 'At least one retrieval system over real documents, one agent that uses tools, and one evaluation that measures quality. A fine-tuning or local model project is a useful extra.'],
      ['How many AI projects do I need in a portfolio?', 'There is no fixed number. Three or four finished projects that you can explain in depth are usually more convincing than many shallow ones.'],
      ['What is a good first AI project for a beginner?', 'A structured summariser or a semantic search tool over your own notes. Both are small, both finish in days, and both teach an idea you will use in every later project.'],
      ['Do AI portfolio projects need to be deployed?', 'It helps, because a running project is easy to judge. If you cannot host it, give clear setup steps and a short recording that shows it working.'],
    ],
    links: [
      ['/lab', 'Open the interactive labs'],
      ['/lesson/ai-agent-loop', 'Lesson: The Agent Loop: Observe, Think, Act, Repeat'],
      ['/lesson/llm-routing', 'Lesson: LLM Routing: Directing Each Query to the Best Model'],
      ['/blog/llm-evaluation-how-to-test-an-ai-application', 'LLM evaluation: how to test an AI application'],
      ['/blog/ai-engineer-interview-questions', 'AI engineer interview questions'],
    ],
  },
  {
    slug: 'llm-evaluation-how-to-test-an-ai-application',
    title: 'LLM Evaluation: How to Test an AI Application Properly',
    description: "LLM evaluation explained: how to build a test set, choose metrics, use an LLM as a judge with care, and evaluate RAG systems and agents before launch.",
    date: '2026-10-08',
    minutes: 8,
    keywords: ['llm evaluation', 'how to evaluate an llm', 'llm evals', 'llm testing', 'llm as a judge', 'rag evaluation', 'ai agent evaluation', 'evaluate llm application'],
    intro: [
      "LLM evaluation is how you find out whether an AI application is good enough, and whether a change made it better or worse. The core of it is simple. Collect a fixed set of realistic inputs. Decide what a good output looks like for each. Run the system on all of them after every change, and score the results in a consistent way.",
      "Without this, every decision about a prompt, a model or a retrieval setting is a guess. This article shows how to set evaluation up in small steps.",
    ],
    sections: [
      {
        h: 'Why is testing an LLM application different?',
        body: [
          "Ordinary software is tested with exact checks. A function that adds two numbers either returns the right sum or does not. An LLM application breaks that pattern in three ways.",
          "First, the output varies. The same input can give different text on different runs. Second, there are many correct answers. Two summaries can use different words and both be good. Third, small changes have wide effects. A prompt edit that fixes one case can quietly break five others.",
          "So you need tests that judge qualities such as correctness and relevance, not exact strings. And you need to run them across many examples at once, not one at a time by hand.",
        ],
      },
      {
        h: 'Model evaluation vs application evaluation',
        body: [
          "Two different things are both called LLM evaluation.",
          "Model evaluation compares models on public benchmarks. It answers a general question: how capable is this model on standard tasks? It is useful for making a shortlist.",
          "Application evaluation tests your whole system on your own task: the prompt, the retrieval, the tools and the model together. A model that leads a benchmark may not be the best for your documents and your users. Only your own test set can tell you. The rest of this article is about this second kind.",
        ],
      },
      {
        h: 'How to build an evaluation set',
        body: [
          "The evaluation set, sometimes called a golden dataset, is the most valuable thing you will build. Start small and grow it.",
        ],
        steps: [
          "Collect thirty to fifty realistic inputs. Use real user questions if you have them.",
          "Include the hard cases: vague questions, questions with no answer in your data, and inputs that try to misuse the system.",
          "For each input, write the expected answer or the points a good answer must contain.",
          "For cases where the system should decline, write that down as the expected behaviour.",
          "Have someone who knows the subject review the expected answers.",
          "Add a new case each time you find a failure in real use, so the same mistake cannot come back unnoticed.",
        ],
      },
      {
        h: 'What should you measure?',
        body: [
          "Pick a few measures that match what your users care about. The table lists the common ones.",
        ],
        table: {
          head: ['Measure', 'The question it answers', 'How it is checked'],
          rows: [
            ['Correctness', 'Does the answer match the expected answer?', 'Comparison with a reference, by a person or a judge model.'],
            ['Faithfulness', 'Is every claim supported by the supplied sources?', 'Each claim is checked against the retrieved text.'],
            ['Relevance', 'Does the answer address the question asked?', 'A judge model or human review.'],
            ['Completeness', 'Is anything important missing?', 'A checklist of required points.'],
            ['Format', 'Is the output valid and well structured?', 'A check in code, such as parsing the JSON.'],
            ['Safety', 'Did it refuse what it should refuse?', 'Rules and test cases written for that purpose.'],
            ['Cost and speed', 'What does a request cost, and how long does it take?', 'Logged token counts and timings.'],
          ],
        },
      },
      {
        h: 'Three ways to score an answer',
        body: [
          "There are three kinds of grader, and a healthy setup uses all of them.",
          "Checks in code are the cheapest and most reliable. Is the output valid JSON? Does it contain the order number? Is it under the length limit? Use them wherever a rule can be written.",
          "Human review is the most trusted and the slowest. Use it to define what good means, to label a starting set and to audit the automatic graders.",
          "LLM-as-a-judge sits between the two. A second model reads the input, the output and a rubric, and gives a score. This scales to thousands of cases. But a judge is a model too. It can be inconsistent, it can favour longer answers, and it can be too generous. Give it a narrow question with a clear rubric. Ask for a pass or a fail before you try fine scales. And compare its verdicts with human labels on a sample before you rely on it.",
        ],
      },
      {
        h: 'How do you evaluate a RAG system?',
        body: [
          "Test retrieval and generation separately. If you only score the final answer, you cannot tell which stage failed.",
          "For retrieval, each test question needs the passages that should be found. Then you can measure recall, the share of the right passages that were retrieved, and precision, the share of retrieved passages that were right. Rank matters as well. A correct passage in tenth place may never reach the prompt.",
          "For generation, hand the model the right passages and check faithfulness and completeness. A high faithfulness score means the answer stayed within the sources. It does not mean the answer was complete or useful, so measure those separately.",
        ],
      },
      {
        h: 'How do you evaluate an AI agent?',
        body: [
          "An agent takes many steps, so there is more to judge. Look at three levels.",
        ],
        list: [
          "The outcome. Was the task completed? Check the final state, such as the file written or the record updated, not only what the agent said.",
          "The path. Did it choose sensible tools with correct arguments? How many steps did it take?",
          "The cost. Tokens, time and the number of tool calls for each task.",
          "Consistency. Run each task several times. An agent that succeeds on some runs and fails on others is not ready.",
        ],
      },
      {
        h: 'Evaluation after launch',
        body: [
          "Testing does not end at release. Real users send inputs you did not predict. Keep traces of requests: the prompt, the retrieved text, the tool calls and the output. Review a sample on a regular schedule. Watch signals such as user ratings, retries and questions that got no answer. Feed every new failure back into the evaluation set.",
          "Run the full set again whenever you change the prompt, the model or the retrieval settings. Model providers update their models too, and an update can shift behaviour.",
          "Module 14 of the AI Engineering Bootcamp, Measuring What Matters, has four lessons: evaluating LLMs, LLM-as-a-judge, evaluating agents and agent observability. The module on securing AI systems adds guardrails and prompt injection.",
        ],
      },
    ],
    faqs: [
      ['What is LLM evaluation?', 'It is the process of measuring how well a language model or an application built on one performs. In practice it means running a fixed set of test inputs and scoring the outputs in a consistent way.'],
      ['What is a golden dataset?', 'It is a set of test inputs paired with trusted expected answers or labels. You run your system against it after each change to see whether quality went up or down.'],
      ['What is LLM-as-a-judge?', 'It is using a language model to grade the output of another model against a rubric. It scales well, but its verdicts should be checked against human labels on a sample.'],
      ['How many test cases do I need to evaluate an LLM application?', 'Start with thirty to fifty realistic cases that cover normal use and hard cases. Add more over time, especially from failures you see in real use.'],
      ['What is the difference between evals and benchmarks?', 'A benchmark is a public test used to compare models in general. Evals for an application are your own tests, built from your own task and data.'],
    ],
    links: [
      ['/module/evaluation', 'Module 14: Measuring What Matters'],
      ['/lesson/llm-evaluation', 'Lesson: Evaluating LLMs: Metrics, Benchmarks, and Methods'],
      ['/lesson/llm-as-a-judge', 'Lesson: LLM-as-Judge: Automating Evaluation with Another Model'],
      ['/lesson/ai-agent-evaluation', 'Lesson: Evaluating AI Agents: Metrics and Methods That Work'],
      ['/lesson/precision-vs-recall', 'Lesson: Precision and Recall: Picking the Right Metric'],
    ],
  },
  {
    slug: 'ai-engineer-vs-software-engineer',
    title: 'AI Engineer vs Software Engineer: How to Move into AI',
    description: "AI engineer vs software engineer: how the two roles differ, which skills carry over, what you must add, and a step-by-step plan to move from software to AI.",
    date: '2026-10-05',
    minutes: 8,
    keywords: ['ai engineer vs software engineer', 'software engineer to ai engineer', 'how to become an ai engineer from software engineer', 'transition to ai engineering', 'ai engineer for developers', 'software developer to ai engineer', 'switch to ai engineering'],
    intro: [
      "An AI engineer is a software engineer who builds products around AI models, mostly large language models. The two roles share most of their skills: writing code, designing systems, testing and shipping. What the AI engineer adds is an understanding of how models behave, and the craft of making an unpredictable part reliable through prompting, retrieval, agents and evaluation.",
      "That makes the move from software to AI a matter of adding a layer, not starting again. This article compares the roles and lays out a plan for the move.",
    ],
    sections: [
      {
        h: 'AI engineer vs software engineer: what is the difference?',
        body: [
          "The table shows the centre of each role. Many real jobs sit somewhere between the columns.",
        ],
        table: {
          head: ['', 'Software engineer', 'AI engineer'],
          rows: [
            ['Builds', 'Applications, services and infrastructure', 'Features and products built around AI models'],
            ['Behaviour of the core logic', 'The same input gives the same output', 'The same input can give different outputs'],
            ['How correctness is checked', 'Unit and integration tests with exact results', 'Evaluation sets, scoring and review of samples'],
            ['Typical debugging', 'Read the stack trace, find the faulty line', 'Read the trace of prompts, retrieved text and tool calls'],
            ['Main cost drivers', 'Compute, storage and network', 'Tokens, model choice and GPU time'],
            ['Extra risks', 'Bugs and outages', 'Wrong answers stated with confidence, prompt injection'],
          ],
        },
      },
      {
        h: 'Which software skills carry over to AI engineering?',
        body: [
          "Most of them. An AI product is still a software product, and the model is one part inside it.",
        ],
        list: [
          "API design, error handling, retries and timeouts. Model calls fail and slow down like any other network call.",
          "Data work. Parsing files, cleaning text and handling JSON are daily tasks in retrieval systems.",
          "Testing habits. The instinct to check every change is exactly what evaluation needs.",
          "System design. Caching, queues, rate limits and streaming all appear in AI systems.",
          "Observability. Logs and traces matter even more when the core part is not predictable.",
          "Security thinking. Treating outside input as untrusted is the basis of defending against prompt injection.",
        ],
      },
      {
        h: 'What does a software engineer need to learn for AI?',
        body: [
          "The gap is in two layers. The first is the model layer: what is going on inside the thing you are calling. The second is the application layer: the patterns for building around it.",
        ],
        list: [
          "Machine learning basics: how a model learns, loss, overfitting, precision and recall.",
          "Neural networks: gradient descent and backpropagation, at the level of one worked example.",
          "How LLMs work: tokens, embeddings, attention, the context window and sampling.",
          "Prompting and context engineering.",
          "RAG: chunking, embeddings, vector search, hybrid search and reranking.",
          "Agents: function calling, the agent loop, memory and MCP.",
          "Evaluation: test sets, judge models and tracing.",
          "Serving: the KV cache, batching, quantization and routing between models.",
        ],
      },
      {
        h: 'The biggest change: working with outputs that are not exact',
        body: [
          "Experienced developers often find the tools easy and the change of mindset harder. In ordinary code, a bug has a cause you can find and remove. In an AI system, a wrong answer may appear in one run out of twenty, with no line of code at fault.",
          "The working method changes to match. You stop asking whether the output is correct and start asking how often it is correct, on which kinds of input. You measure before and after every change. You design for failure: what the product does when the model is wrong, slow or unsure.",
          "Developers who accept this early progress quickly. Those who keep expecting exact behaviour tend to stay stuck adjusting prompts by feel.",
        ],
      },
      {
        h: 'How to move from software engineer to AI engineer, step by step',
        body: [
          "This order keeps you building from the first week while you fill in the theory.",
        ],
        steps: [
          "Call a model from code. Build one small feature, such as turning free text into structured data.",
          "Learn how the model works: tokens, embeddings, attention and sampling. Your first project will start to make sense.",
          "Go back for the foundations: machine learning basics and how neural networks train.",
          "Build a RAG system over documents you know, and print what it retrieves.",
          "Write an evaluation set for it and track the score across changes.",
          "Build an agent with a few tools, and write the loop yourself before you use a framework.",
          "Learn the production side: cost, response time, caching, guardrails and prompt injection.",
          "Bring it to your current job. Propose one small AI feature, measure it and ship it.",
        ],
      },
      {
        h: 'Do you need to go back to math?',
        body: [
          "Not to the extent many developers fear. For building products you need vectors, matrix multiplication, the idea of a slope and basic probability. That is enough to follow embeddings, attention and training.",
          "You do not need to derive every formula. It is worth following one worked example of backpropagation and one of attention with small numbers. After that the formulas in documentation stop being a wall.",
          "Research roles and jobs that train large models from scratch ask for more. If that is your aim, plan for deeper study of linear algebra, calculus and statistics.",
        ],
      },
      {
        h: 'How to get AI experience while in a software job',
        body: [
          "The easiest route into the role is often through the job you already have.",
        ],
        list: [
          "Look for a task in your team that is mostly reading and writing text, such as triaging tickets or searching internal documents.",
          "Build a small internal tool for it and measure whether it helps.",
          "Volunteer for the evaluation work on any AI feature your company is building. Few people ask for it, and it teaches the most.",
          "Write down what you built, what you measured and what failed. That record is your portfolio.",
        ],
      },
      {
        h: 'A learning path for developers',
        body: [
          "The AI Engineering Bootcamp is arranged for this kind of move. The ML and Deep Learning track covers the model layer. The Generative AI Engineering track covers the application layer. The Complete AI Engineer track covers both in order and includes the certificate of completion.",
          "A developer can move quickly through the lessons on transport protocols and system design, and spend more time on the Transformer, RAG, agents and evaluation. The first lesson is free with a free account.",
          "No course can promise a new role. What it can do is give you the knowledge in a sensible order, so the projects you build rest on understanding.",
        ],
      },
    ],
    faqs: [
      ['Is an AI engineer a software engineer?', 'In most companies, yes. An AI engineer writes and ships software. The difference is that the software is built around AI models, which adds skills such as prompting, retrieval and evaluation.'],
      ['Can a software engineer become an AI engineer?', 'Yes, and it is a common route. Software engineers already have the engineering half of the job. They need to add an understanding of models and the patterns for building with them.'],
      ['How long does it take to move from software engineer to AI engineer?', 'It depends on your background and your hours. A working developer who studies steadily can cover the core concepts in a few months. Confidence comes from building and measuring real projects on top of that.'],
      ['Do I need a machine learning degree to become an AI engineer?', 'The skills can be learned without one. Employers differ in what they ask for, so read the requirements of the roles you want.'],
      ['Should I learn machine learning or LLMs first as a developer?', 'Start by building something small with an LLM to stay motivated, then go back and learn the machine learning and deep learning basics. They make debugging far easier.'],
    ],
    links: [
      ['/ai-engineer-roadmap', 'AI engineer roadmap: what to learn, in order'],
      ['/lesson/system-design', 'Lesson: System Design Fundamentals for AI Engineers'],
      ['/blog/ai-engineer-vs-ml-engineer-vs-data-scientist', 'AI engineer vs ML engineer vs data scientist'],
      ['/blog/ai-engineer-projects-for-portfolio', 'AI engineer projects for your portfolio'],
      ['/pricing', 'Compare the three tracks'],
    ],
  },
];
